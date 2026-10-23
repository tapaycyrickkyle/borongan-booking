import { randomUUID } from "node:crypto";

export async function createNotification(db, { recipientUserId, reservationId = null, type, title, body }) {
  return db.prepare("INSERT INTO notifications (id, recipient_user_id, reservation_id, type, title, body) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(randomUUID(), recipientUserId, reservationId, type, title, body)
    .run();
}
