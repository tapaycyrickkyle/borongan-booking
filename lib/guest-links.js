import { randomBytes, createHash } from "node:crypto";

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

export function hashGuestToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function issueGuestLink(db, { reservationId, purpose = "reservation", expiresAt }) {
  const rawToken = toBase64Url(randomBytes(32));
  await db.prepare("INSERT INTO guest_access_tokens (id, reservation_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), reservationId, hashGuestToken(rawToken), purpose, expiresAt)
    .run();
  return rawToken;
}

export async function getGuestReservation(db, rawToken) {
  if (!rawToken || typeof rawToken !== "string") return null;
  const row = await db.prepare(`
    SELECT r.id, r.reference_number, r.guest_name, r.guest_email, r.guest_phone, r.guest_count,
           r.check_in, r.check_out, r.status, r.agreed_total_centavos, r.estimated_total_centavos,
           p.title AS property_title, p.location_text, u.name AS unit_name,
           t.id AS token_id
    FROM guest_access_tokens t
    JOIN reservations r ON r.id = t.reservation_id
    JOIN properties p ON p.id = r.property_id
    JOIN units u ON u.id = r.unit_id
    WHERE t.token_hash = ? AND t.revoked_at IS NULL AND t.expires_at > CURRENT_TIMESTAMP
  `).bind(hashGuestToken(rawToken)).first();
  if (!row) return null;
  await db.prepare("UPDATE guest_access_tokens SET last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.token_id).run();
  return row;
}
