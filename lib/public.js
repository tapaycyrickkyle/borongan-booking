import { getDb } from "./db.js";
import { getAvailableUnits } from "./availability.js";
import { resolveReservationPrice } from "./pricing.js";

export function getBusinessInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words.at(-1)[0]}` : words[0]?.slice(0, 2) || "BS").toUpperCase();
}

export function groupUnitsByBusiness(rows) {
  const businesses = new Map();
  for (const row of rows) {
    let business = businesses.get(row.business_id);
    if (!business) {
      business = { business_id: row.business_id, business_name: row.business_name, properties: [] };
      businesses.set(row.business_id, business);
    }
    let property = business.properties.find((item) => item.property_id === row.property_id);
    if (!property) {
      property = { ...row, units: [] };
      business.properties.push(property);
    }
    property.units.push(row);
  }
  return [...businesses.values()];
}

function parsePriceCentavos(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) return null;
  return Math.round(amount * 100);
}

export function filterListingsByPrice(rows, filters = {}) {
  const minPrice = parsePriceCentavos(filters.minPrice);
  const maxPrice = parsePriceCentavos(filters.maxPrice);
  if (minPrice == null && maxPrice == null) return rows;

  return rows.filter((row) => {
    const price = row.amount_centavos ?? row.price_per_night;
    if (!Number.isFinite(price)) return false;
    return (minPrice == null || price >= minPrice) && (maxPrice == null || price <= maxPrice);
  });
}

export async function searchPublishedUnits(filters) {
  const rows = await getAvailableUnits(await getDb(), filters);
  if (!filters.checkIn || !filters.checkOut) return filterListingsByPrice(rows, filters);
  const pricedRows = await Promise.all(rows.map(async (row) => ({
    ...row,
    amount_centavos: (await getUnitPrice(row.unit_id, filters.checkIn, filters.checkOut))?.nights?.[0]?.amountCentavos ?? null,
  })));
  return filterListingsByPrice(pricedRows, filters);
}

export async function getPublishedProperty(slug) {
  const db = await getDb();
  const property = await db.prepare(`
    SELECT p.*, b.name AS business_name
    FROM properties p
    JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
    WHERE p.slug = ? AND p.publication_status = 'published' AND p.archived_at IS NULL
  `).bind(slug).first();
  if (!property) return null;
  const units = await db.prepare("SELECT * FROM units WHERE property_id = ? AND is_active = 1 ORDER BY name").bind(property.id).all();
  const images = await db.prepare("SELECT id, object_key, alt_text, sort_order, is_cover FROM property_images WHERE property_id = ? AND moderation_status = 'active' ORDER BY is_cover DESC, sort_order").bind(property.id).all();
  return { property, units: units.results ?? [], images: images.results ?? [], db };
}

export async function getPublishedBusinessRooms(businessId) {
  const db = await getDb();
  const business = await db.prepare("SELECT id, name, description FROM businesses WHERE id = ? AND status = 'active'").bind(businessId).first();
  if (!business) return null;
  const result = await db.prepare(`
    SELECT p.id AS property_id, p.slug AS property_slug, p.title AS property_title,
           p.location_text, u.id AS unit_id, u.name AS unit_name,
           u.rental_mode, u.capacity,
           (SELECT ui.object_key FROM unit_images ui
            WHERE ui.unit_id = u.id AND ui.moderation_status = 'active'
            ORDER BY ui.is_cover DESC, ui.sort_order ASC LIMIT 1) AS unit_image_key,
           (SELECT pi.object_key FROM property_images pi
            WHERE pi.property_id = p.id AND pi.moderation_status = 'active'
            ORDER BY pi.is_cover DESC, pi.sort_order ASC LIMIT 1) AS property_image_key,
           (SELECT MIN(nr.amount_centavos) FROM nightly_rates nr
            WHERE nr.unit_id = u.id AND nr.ends_on > CURRENT_DATE) AS price_per_night
    FROM properties p
    JOIN units u ON u.property_id = p.id AND u.is_active = 1
    WHERE p.business_id = ? AND p.publication_status = 'published' AND p.archived_at IS NULL
    ORDER BY p.title, u.name
  `).bind(businessId).all();
  return { business, rooms: result.results ?? [] };
}

export async function getUnitPrice(unitId, checkIn, checkOut) {
  try {
    return await resolveReservationPrice(await getDb(), { unitId, checkIn, checkOut });
  } catch (error) {
    if (String(error?.message).startsWith("missing_rate:")) return null;
    throw error;
  }
}
