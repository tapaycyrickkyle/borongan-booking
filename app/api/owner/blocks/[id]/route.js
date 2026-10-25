import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    const block = await db.prepare("SELECT bd.id FROM blocked_dates bd JOIN units u ON u.id = bd.unit_id JOIN properties p ON p.id = u.property_id JOIN businesses b ON b.id = p.business_id WHERE bd.id = ? AND b.owner_user_id = ? AND b.status = 'active'").bind(id, user.id).first();
    if (!block) return Response.json({ error: "not_found" }, { status: 404 });
    await db.prepare("DELETE FROM blocked_dates WHERE id = ?").bind(id).run();
    return Response.json({ status: "deleted" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "block_delete_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}
