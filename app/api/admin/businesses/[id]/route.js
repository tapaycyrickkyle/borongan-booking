import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["admin"]);
    const { status, reason } = await request.json();
    if (!["active", "suspended"].includes(status)) return Response.json({ error: "invalid_status" }, { status: 400 });
    const db = await getDb();
    await db.batch([
      db.prepare("UPDATE businesses SET status = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, reason || null, id),
      db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, 'business', ?, ?)").bind(crypto.randomUUID(), user.id, `business.${status}`, id, JSON.stringify({ reason: reason || null })),
    ]);
    return Response.json({ status });
  } catch { return Response.json({ error: "forbidden" }, { status: 403 }); }
}
