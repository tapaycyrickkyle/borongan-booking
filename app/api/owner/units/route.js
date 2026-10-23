import { randomUUID } from "node:crypto";
import { getDb } from "../../../../lib/db.js";
import { requireUser, assertPropertyOwner } from "../../../../lib/permissions.js";

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const capacity = Number(input.capacity);
    if (!input.propertyId || typeof input.name !== "string" || !["room", "entire_property"].includes(input.rentalMode) || !Number.isInteger(capacity) || capacity < 1 || capacity > 50) throw new Error("invalid_unit_input");
    const db = await getDb();
    await assertPropertyOwner(db, user.id, input.propertyId);
    const id = randomUUID();
    await db.prepare("INSERT INTO units (id, property_id, name, rental_mode, capacity) VALUES (?, ?, ?, ?, ?)").bind(id, input.propertyId, input.name.trim(), input.rentalMode, capacity).run();
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "invalid_unit_input" ? code : "unit_create_failed" }, { status: code === "invalid_unit_input" ? 400 : 500 });
  }
}
