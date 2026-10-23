import { getDb } from "../../../../../lib/db.js";
import { getGuestReservation } from "../../../../../lib/guest-links.js";
import { transitionReservation } from "../../../../../lib/booking.js";

export async function POST(request, context) {
  const { reference } = await context.params;
  try {
    const { token } = await request.json();
    const db = await getDb();
    const reservation = await getGuestReservation(db, token);
    if (!reservation || reservation.reference_number !== reference) return Response.json({ error: "not_found" }, { status: 404 });
    await transitionReservation({ db, reservationId: reservation.id, nextStatus: "cancellation_requested", reason: "Guest requested cancellation" });
    return Response.json({ status: "cancellation_requested" });
  } catch (error) {
    const code = String(error?.message ?? "cancellation_failed");
    const status = ["invalid_transition", "cancellation_window_closed", "not_found"].includes(code) ? 400 : 500;
    return Response.json({ error: status === 500 ? "cancellation_failed" : code }, { status });
  }
}
