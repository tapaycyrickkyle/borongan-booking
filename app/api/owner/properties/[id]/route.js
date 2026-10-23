import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";
import { assertPropertyOwner } from "../../../../../lib/permissions.js";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const allowed = ["title", "locationText", "description", "houseRules", "cancellationPolicy", "capacity"];
    const fields = Object.keys(input).filter((key) => allowed.includes(key));
    if (!fields.length) return Response.json({ error: "no_changes" }, { status: 400 });
    const db = await getDb();
    await assertPropertyOwner(db, user.id, id);
    const columnMap = { title: "title", locationText: "location_text", description: "description", houseRules: "house_rules", cancellationPolicy: "cancellation_policy", capacity: "capacity" };
    const values = fields.map((field) => input[field]);
    const assignments = fields.map((field) => `${columnMap[field]} = ?`).join(", ");
    await db.prepare(`UPDATE properties SET ${assignments}, publication_status = CASE WHEN publication_status = 'published' THEN 'pending_review' ELSE publication_status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values, id).run();
    return Response.json({ status: "updated" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "property_update_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}
