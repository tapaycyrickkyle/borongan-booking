import { randomUUID } from "node:crypto";
import { getDb } from "../../../../lib/db.js";
import { requireUser, assertPropertyOwner } from "../../../../lib/permissions.js";

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const amountCentavos = Math.round(Number(input.amountPesos) * 100);
    if (!input.unitId || !/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn) || input.endsOn <= input.startsOn || !Number.isInteger(amountCentavos) || amountCentavos < 0) throw new Error("invalid_rate_input");
    const db = await getDb();
    const property = await db.prepare("SELECT property_id FROM units WHERE id = ?").bind(input.unitId).first();
    if (!property) throw new Error("not_found");
    await assertPropertyOwner(db, user.id, property.property_id);
    await db.prepare("INSERT INTO nightly_rates (id, unit_id, starts_on, ends_on, amount_centavos) VALUES (?, ?, ?, ?, ?)").bind(randomUUID(), input.unitId, input.startsOn, input.endsOn, amountCentavos).run();
    return Response.json({ status: "created" }, { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "invalid_rate_input" ? code : "rate_create_failed" }, { status: code === "invalid_rate_input" ? 400 : 500 });
  }
}
