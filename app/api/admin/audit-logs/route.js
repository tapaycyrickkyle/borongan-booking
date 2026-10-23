import { getDb } from "../../../../lib/db.js";
import { requireUser } from "../../../../lib/permissions.js";

export async function GET(request) {
  try { await requireUser(request, ["admin"]); const result = await (await getDb()).prepare("SELECT id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200").all(); return Response.json({ rows: result.results ?? [] }); } catch { return Response.json({ error: "forbidden" }, { status: 403 }); }
}
