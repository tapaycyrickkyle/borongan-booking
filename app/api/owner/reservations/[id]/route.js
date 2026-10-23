import { getDb } from "../../../../../lib/db.js";
import { requireUser, assertBusinessOwner } from "../../../../../lib/permissions.js";
import { approveReservation, transitionReservation } from "../../../../../lib/booking.js";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    const reservation = await db.prepare("SELECT r.id, r.status, p.business_id AS business_id FROM reservations r JOIN properties p ON p.id = r.property_id WHERE r.id = ?").bind(id).first();
    if (!reservation) return Response.json({ error: "not_found" }, { status: 404 });
    await assertBusinessOwner(db, user.id, reservation.business_id);
    const { action, reason } = await request.json();
    const result = action === "approve" ? await approveReservation({ db, reservationId: id, actorUserId: user.id }) : await transitionReservation({ db, reservationId: id, actorUserId: user.id, nextStatus: ({ decline: "declined", check_in: "checked_in", complete: "completed", no_show: "no_show", cancel: "cancelled", approve_cancellation: "cancelled", decline_cancellation: "confirmed" })[action], reason });
    return Response.json(result);
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "reservation_action_failed" }, { status: code === "forbidden" ? 403 : 400 });
  }
}
