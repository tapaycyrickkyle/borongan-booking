import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";

async function getOwnedUnit(db, userId, id) {
  const unit = await db.prepare("SELECT u.id, u.property_id FROM units u JOIN properties p ON p.id = u.property_id JOIN businesses b ON b.id = p.business_id WHERE u.id = ? AND b.owner_user_id = ? AND b.status = 'active'").bind(id, userId).first();
  if (!unit) throw new Error("forbidden");
  return unit;
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const db = await getDb();
    const unit = await getOwnedUnit(db, user.id, id);
    const updates = {};
    if (Object.hasOwn(input, "name")) {
      if (typeof input.name !== "string" || input.name.trim().length < 2) return Response.json({ error: "invalid_unit_input" }, { status: 400 });
      updates.name = input.name.trim();
    }
    if (Object.hasOwn(input, "capacity")) {
      const capacity = Number(input.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) return Response.json({ error: "invalid_unit_input" }, { status: 400 });
      updates.capacity = capacity;
    }
    if (Object.hasOwn(input, "rentalMode")) {
      if (!["room", "entire_property"].includes(input.rentalMode)) return Response.json({ error: "invalid_unit_input" }, { status: 400 });
      updates.rentalMode = input.rentalMode;
    }
    const fields = Object.keys(updates);
    if (!fields.length) return Response.json({ error: "no_changes" }, { status: 400 });
    const columnMap = { name: "name", capacity: "capacity", rentalMode: "rental_mode" };
    await db.prepare(`UPDATE units SET ${fields.map((field) => `${columnMap[field]} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...fields.map((field) => updates[field]), id).run();
    return Response.json({ status: "updated", propertyId: unit.property_id });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "unit_update_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    await getOwnedUnit(db, user.id, id);
    const result = await db.prepare("UPDATE units SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1").bind(id).run();
    if (!result?.meta?.changes) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ status: "archived" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "unit_archive_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}
