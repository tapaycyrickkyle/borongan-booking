import { getDb } from "./db.js";
import { getAvailableUnits } from "./availability.js";
import { resolveReservationPrice } from "./pricing.js";

export async function searchPublishedUnits(filters) {
  const rows = await getAvailableUnits(await getDb(), filters);
  if (!filters.checkIn || !filters.checkOut) return rows;
  return Promise.all(rows.map(async (row) => ({
    ...row,
    amount_centavos: (await getUnitPrice(row.unit_id, filters.checkIn, filters.checkOut))?.nights?.[0]?.amountCentavos ?? null,
  })));
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

export async function getUnitPrice(unitId, checkIn, checkOut) {
  try {
    return await resolveReservationPrice(await getDb(), { unitId, checkIn, checkOut });
  } catch (error) {
    if (String(error?.message).startsWith("missing_rate:")) return null;
    throw error;
  }
}
