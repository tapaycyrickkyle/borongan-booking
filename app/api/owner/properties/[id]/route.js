import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";
import { assertPropertyOwner } from "../../../../../lib/permissions.js";

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const db = await getDb();
    await assertPropertyOwner(db, user.id, id);

    if (input.action === "submit") {
      const units = await db.prepare("SELECT COUNT(*) AS count FROM units WHERE property_id = ? AND is_active = 1").bind(id).first();
      const rates = await db.prepare("SELECT COUNT(*) AS count FROM nightly_rates nr JOIN units u ON u.id = nr.unit_id WHERE u.property_id = ? AND u.is_active = 1").bind(id).first();
      if (!Number(units?.count) || !Number(rates?.count)) return Response.json({ error: "incomplete_property" }, { status: 400 });
      await db.prepare("UPDATE properties SET publication_status = 'pending_review', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
      return Response.json({ status: "pending_review" });
    }

    const updates = {};
    for (const [key, value] of Object.entries(input)) {
      if (["title", "locationText", "description", "houseRules", "cancellationPolicy"].includes(key)) {
        if (typeof value !== "string" || value.trim().length < 2) return Response.json({ error: "invalid_property_input" }, { status: 400 });
        updates[key] = value.trim();
      }
    }
    if (Object.hasOwn(input, "capacity")) {
      const capacity = Number(input.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) return Response.json({ error: "invalid_property_input" }, { status: 400 });
      updates.capacity = capacity;
    }
    const fields = Object.keys(updates);
    if (!fields.length) return Response.json({ error: "no_changes" }, { status: 400 });
    const columnMap = { title: "title", locationText: "location_text", description: "description", houseRules: "house_rules", cancellationPolicy: "cancellation_policy", capacity: "capacity" };
    const values = fields.map((field) => updates[field]);
    const assignments = fields.map((field) => `${columnMap[field]} = ?`).join(", ");
    await db.prepare(`UPDATE properties SET ${assignments}, publication_status = CASE WHEN publication_status = 'published' THEN 'pending_review' ELSE publication_status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values, id).run();
    return Response.json({ status: "updated" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "property_update_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    await assertPropertyOwner(db, user.id, id);
    const result = await db.prepare("UPDATE properties SET archived_at = CURRENT_TIMESTAMP, publication_status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND archived_at IS NULL").bind(id).run();
    if (!result?.meta?.changes) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ status: "archived" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "property_archive_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}
