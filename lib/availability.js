import { overlaps } from "./dates.js";

export const BLOCKING_STATUSES = ["confirmed", "checked_in", "completed", "blocked"];

export function hasInventoryConflict(candidate, existing) {
  if (!BLOCKING_STATUSES.includes(existing.status)) return false;
  if (candidate.propertyId !== existing.propertyId) return false;
  if (!overlaps(candidate.checkIn, candidate.checkOut, existing.checkIn, existing.checkOut)) return false;
  if (candidate.rentalMode === "entire_property" || existing.rentalMode === "entire_property") return true;
  return candidate.unitId === existing.unitId;
}

export async function getAvailableUnits(db, filters = {}) {
  const params = [];
  const conditions = ["p.publication_status = 'published'", "p.archived_at IS NULL", "u.is_active = 1"];

  if (filters.propertyType) {
    conditions.push("p.property_type = ?");
    params.push(filters.propertyType);
  }
  const searchTerm = String(filters.q || "").trim();
  if (searchTerm) {
    const searchLike = `%${searchTerm}%`;
    conditions.push("(p.title LIKE ? OR p.location_text LIKE ? OR b.name LIKE ?)");
    params.push(searchLike, searchLike, searchLike);
  }
  if (filters.rentalMode) {
    conditions.push("u.rental_mode = ?");
    params.push(filters.rentalMode);
  }
  if (filters.guestCount) {
    conditions.push("u.capacity >= ?");
    params.push(Number(filters.guestCount));
  }
  if (filters.checkIn && filters.checkOut) {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM blocked_dates b
      WHERE b.unit_id = u.id AND b.starts_on < ? AND ? < b.ends_on
    )`);
    params.push(filters.checkOut, filters.checkIn);
    conditions.push(`NOT EXISTS (
      SELECT 1
      FROM reservations r
      JOIN units reserved_unit ON reserved_unit.id = r.unit_id
      WHERE r.property_id = p.id
        AND r.status IN ('confirmed', 'checked_in', 'completed')
        AND r.check_in < ? AND ? < r.check_out
        AND (r.unit_id = u.id OR reserved_unit.rental_mode = 'entire_property' OR u.rental_mode = 'entire_property')
    )`);
    params.push(filters.checkOut, filters.checkIn);
  }

  const result = await db.prepare(`
    SELECT p.id AS property_id, p.business_id AS business_id, b.name AS business_name,
           p.slug, p.title, p.property_type, p.rental_mode AS property_rental_mode,
           p.location_text, p.description, p.capacity AS property_capacity,
           (SELECT pi.object_key FROM property_images pi
            WHERE pi.property_id = p.id AND pi.moderation_status = 'active'
            ORDER BY pi.is_cover DESC, pi.sort_order ASC LIMIT 1) AS property_image_key,
           (SELECT MIN(nr.amount_centavos) FROM nightly_rates nr
            WHERE nr.unit_id = u.id AND nr.ends_on > CURRENT_DATE) AS price_per_night,
           u.id AS unit_id, u.name AS unit_name, u.rental_mode, u.capacity
    FROM properties p
    JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
    JOIN units u ON u.property_id = p.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.title, u.name
  `).bind(...params).all();
  const rows = result.results ?? [];
  const logos = new Map();
  const logoResult = await db.prepare("SELECT id, logo_object_key FROM businesses WHERE status = 'active'").all();
  for (const logo of logoResult.results ?? []) logos.set(logo.id, logo.logo_object_key);
  return rows.map((row) => ({ ...row, business_logo_key: logos.get(row.business_id) ?? null }));
}

export async function findBlockingReservations(db, reservation) {
  const result = await db.prepare(`
    SELECT r.id, r.property_id AS propertyId, r.unit_id AS unitId,
           reserved_unit.rental_mode AS rentalMode,
           r.check_in AS checkIn, r.check_out AS checkOut, r.status
    FROM reservations r
    JOIN units reserved_unit ON reserved_unit.id = r.unit_id
    WHERE r.property_id = ?
      AND r.status IN ('confirmed', 'checked_in', 'completed')
      AND r.check_in < ? AND ? < r.check_out
  `).bind(reservation.propertyId, reservation.checkOut, reservation.checkIn).all();
  const blockedResult = await db.prepare(`
    SELECT b.id, b.unit_id AS unitId, blocked_unit.rental_mode AS rentalMode,
           b.starts_on AS checkIn, b.ends_on AS checkOut, 'blocked' AS status,
           b.reason
    FROM blocked_dates b
    JOIN units blocked_unit ON blocked_unit.id = b.unit_id
    WHERE blocked_unit.property_id = ? AND b.starts_on < ? AND ? < b.ends_on
  `).bind(reservation.propertyId, reservation.checkOut, reservation.checkIn).all();
  return [...(result.results ?? []), ...(blockedResult.results ?? [])].filter((existing) => hasInventoryConflict(reservation, existing));
}
