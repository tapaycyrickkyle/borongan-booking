import { randomUUID } from "node:crypto";
import { parseStayDates } from "./dates.js";
import { findBlockingReservations } from "./availability.js";
import { resolveReservationPrice } from "./pricing.js";
import { getDb } from "./db.js";
import { getRequiredSecret } from "./env.js";
import { validateReservationInput } from "./validation.js";
import { issueGuestLink, hashGuestToken } from "./guest-links.js";

const TRANSITIONS = {
  pending: ["confirmed", "declined", "cancellation_requested"],
  confirmed: ["checked_in", "no_show", "cancellation_requested", "cancelled"],
  checked_in: ["completed", "cancellation_requested", "cancelled"],
  cancellation_requested: ["confirmed", "cancelled"],
};

export function canTransition(fromStatus, toStatus) {
  return TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function assertTransition(fromStatus, toStatus, { now = new Date(), checkIn, checkOut } = {}) {
  if (!canTransition(fromStatus, toStatus)) throw new Error("invalid_transition");
  const today = now.toISOString().slice(0, 10);
  if ((toStatus === "checked_in" || toStatus === "no_show") && today < checkIn) {
    throw new Error("check_in_date_not_reached");
  }
  if (toStatus === "completed" && today < checkOut) throw new Error("checkout_not_reached");
  if ((toStatus === "cancellation_requested" || toStatus === "cancelled") && today >= checkOut) {
    throw new Error("cancellation_window_closed");
  }
}

export async function transitionReservation({ db, reservationId, actorUserId = null, nextStatus, reason = null, now = new Date() }) {
  const reservation = await db.prepare("SELECT id, status, check_in AS checkIn, check_out AS checkOut FROM reservations WHERE id = ?").bind(reservationId).first();
  if (!reservation) throw new Error("reservation_not_found");
  assertTransition(reservation.status, nextStatus, { now, checkIn: reservation.checkIn, checkOut: reservation.checkOut });

  const timestampColumn = {
    confirmed: "approved_at",
    checked_in: "checked_in_at",
    completed: "completed_at",
    no_show: "no_show_at",
    cancelled: "cancelled_at",
  }[nextStatus];
  const timestampSql = timestampColumn ? `, ${timestampColumn} = CURRENT_TIMESTAMP` : "";
  const idempotencyKey = randomUUID();
  const statements = [
    db.prepare(`UPDATE reservations SET status = ?, owner_decision_reason = COALESCE(?, owner_decision_reason), updated_at = CURRENT_TIMESTAMP${timestampSql} WHERE id = ? AND status = ?`).bind(nextStatus, reason, reservationId, reservation.status),
    db.prepare("INSERT INTO reservation_status_history (id, reservation_id, from_status, to_status, actor_user_id, reason, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(randomUUID(), reservationId, reservation.status, nextStatus, actorUserId, reason, idempotencyKey),
    db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, ?, ?, ?)").bind(randomUUID(), actorUserId, `reservation.${nextStatus}`, "reservation", reservationId, JSON.stringify({ reason })),
  ];
  const results = await db.batch(statements);
  if (!results?.[0]?.meta?.changes) throw new Error("reservation_changed");
  return db.prepare("SELECT * FROM reservations WHERE id = ?").bind(reservationId).first();
}

export async function approveReservation({ db, reservationId, actorUserId }) {
  const reservation = await db.prepare(`
    SELECT r.*, p.business_id AS businessId, u.rental_mode AS rentalMode
    FROM reservations r
    JOIN properties p ON p.id = r.property_id
    JOIN units u ON u.id = r.unit_id
    WHERE r.id = ?
  `).bind(reservationId).first();
  if (!reservation) throw new Error("reservation_not_found");
  if (reservation.status !== "pending") throw new Error("reservation_not_pending");

  const conflicts = await findBlockingReservations(db, {
    propertyId: reservation.property_id,
    unitId: reservation.unit_id,
    rentalMode: reservation.rentalMode,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    status: reservation.status,
  });
  if (conflicts.length) return { status: "conflict", conflicts };
  const price = await resolveReservationPrice(db, { unitId: reservation.unit_id, checkIn: reservation.check_in, checkOut: reservation.check_out });
  const idempotencyKey = randomUUID();
  const statements = [
    db.prepare("UPDATE reservations SET status = 'confirmed', agreed_total_centavos = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(price.totalCentavos, reservationId),
    ...price.nights.map((night) => db.prepare("INSERT INTO reservation_rate_snapshots (id, reservation_id, stay_date, amount_centavos) VALUES (?, ?, ?, ?)").bind(randomUUID(), reservationId, night.date, night.amountCentavos)),
    db.prepare("INSERT INTO reservation_status_history (id, reservation_id, from_status, to_status, actor_user_id, idempotency_key) VALUES (?, ?, 'pending', 'confirmed', ?, ?)").bind(randomUUID(), reservationId, actorUserId, idempotencyKey),
    db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'reservation.confirmed', 'reservation', ?, ?)").bind(randomUUID(), actorUserId, reservationId, JSON.stringify({ totalCentavos: price.totalCentavos })),
    db.prepare("INSERT INTO notifications (id, recipient_user_id, reservation_id, type, title, body) VALUES (?, ?, ?, 'reservation_confirmed', 'Reservation approved', 'A reservation was approved.')").bind(randomUUID(), actorUserId, reservationId),
  ];
  const results = await db.batch(statements);
  if (!results?.[0]?.meta?.changes) return { status: "conflict", conflicts: [{ reason: "reservation_changed" }] };
  return { status: "confirmed" };
}

export async function createGuestReservation(input, request) {
  const normalized = validateReservationInput(input);
  if (typeof input.propertyId !== "string" || typeof input.unitId !== "string") throw new Error("invalid_reservation_input");
  const appUrl = await getRequiredSecret("NEXT_PUBLIC_APP_URL");
  const db = await getDb();
  const listing = await db.prepare(`
    SELECT p.id AS propertyId, p.business_id AS businessId, p.title, p.cancellation_policy,
           p.property_type AS propertyType, p.rental_mode AS propertyRentalMode,
           u.id AS unitId, u.name AS unitName, u.rental_mode AS rentalMode,
           b.owner_user_id AS ownerUserId
    FROM properties p
    JOIN units u ON u.property_id = p.id AND u.id = ? AND u.is_active = 1
    JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
    WHERE p.id = ? AND p.publication_status = 'published' AND p.archived_at IS NULL
  `).bind(input.unitId, input.propertyId).first();
  if (!listing || listing.propertyType !== normalized.propertyType || listing.rentalMode !== normalized.rentalMode) {
    throw new Error("listing_unavailable");
  }

  const conflicts = await findBlockingReservations(db, {
    propertyId: listing.propertyId,
    unitId: listing.unitId,
    rentalMode: listing.rentalMode,
    checkIn: normalized.checkIn,
    checkOut: normalized.checkOut,
    status: "pending",
  });
  if (conflicts.length) throw new Error("dates_unavailable");

  let estimatedTotalCentavos = null;
  try {
    estimatedTotalCentavos = (await resolveReservationPrice(db, {
      unitId: listing.unitId,
      checkIn: normalized.checkIn,
      checkOut: normalized.checkOut,
    })).totalCentavos;
  } catch (error) {
    if (!String(error?.message).startsWith("missing_rate:")) throw error;
  }

  const reference = `BOR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const reservationId = randomUUID();
  const rawToken = (await import("node:crypto")).randomBytes(32).toString("base64url");
  const expiresAt = new Date(`${normalized.checkOut}T00:00:00.000Z`);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 30);
  const idempotencyKey = randomUUID();
  const statements = [
    db.prepare(`INSERT INTO reservations (id, reference_number, property_id, unit_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, estimated_total_centavos, cancellation_policy_snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(reservationId, reference, listing.propertyId, listing.unitId, normalized.guestName, normalized.email, normalized.phone, normalized.guestCount, normalized.checkIn, normalized.checkOut, estimatedTotalCentavos, listing.cancellation_policy),
    db.prepare("INSERT INTO reservation_status_history (id, reservation_id, from_status, to_status, idempotency_key) VALUES (?, ?, NULL, 'pending', ?)").bind(randomUUID(), reservationId, idempotencyKey),
    db.prepare("INSERT INTO guest_access_tokens (id, reservation_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, 'reservation', ?)").bind(randomUUID(), reservationId, hashGuestToken(rawToken), expiresAt.toISOString()),
    db.prepare("INSERT INTO notifications (id, recipient_user_id, reservation_id, type, title, body) VALUES (?, ?, ?, 'reservation_request', 'New reservation request', 'A guest submitted a new reservation request.')").bind(randomUUID(), listing.ownerUserId, reservationId),
  ];
  await db.batch(statements);

  const accessUrl = `${appUrl.replace(/\/$/, "")}/reservations/${encodeURIComponent(reference)}?token=${encodeURIComponent(rawToken)}`;
  return { reference, accessUrl };
}
