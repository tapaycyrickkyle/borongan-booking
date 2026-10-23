import { randomUUID } from "node:crypto";
import { getDb } from "../../../../lib/db.js";
import { requireUser, assertPropertyOwner } from "../../../../lib/permissions.js";

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    if (!input.unitId || !input.reason || !/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn) || input.endsOn <= input.startsOn) throw new Error("invalid_block_input");
    const db = await getDb();
    const property = await db.prepare("SELECT property_id FROM units WHERE id = ?").bind(input.unitId).first();
    if (!property) throw new Error("not_found");
    await assertPropertyOwner(db, user.id, property.property_id);
    await db.prepare("INSERT INTO blocked_dates (id, unit_id, starts_on, ends_on, reason, created_by) VALUES (?, ?, ?, ?, ?, ?)").bind(randomUUID(), input.unitId, input.startsOn, input.endsOn, input.reason.trim(), user.id).run();
    return Response.json({ status: "created" }, { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "invalid_block_input" ? code : "block_create_failed" }, { status: code === "invalid_block_input" ? 400 : 500 });
  }
}
