import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["admin"]);
    const { status, reason } = await request.json();
    if (!["published", "rejected", "suspended"].includes(status)) return Response.json({ error: "invalid_status" }, { status: 400 });
    const db = await getDb();
    await db.batch([
      db.prepare("UPDATE properties SET publication_status = ?, rejection_reason = ?, approved_by = ?, approved_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE approved_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, reason || null, user.id, status, id),
      db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, 'property', ?, ?)").bind(crypto.randomUUID(), user.id, `property.${status}`, id, JSON.stringify({ reason: reason || null })),
    ]);
    return Response.json({ status });
  } catch { return Response.json({ error: "forbidden" }, { status: 403 }); }
}
