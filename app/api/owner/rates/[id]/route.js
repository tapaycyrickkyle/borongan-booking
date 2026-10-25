import { getDb } from "../../../../../lib/db.js";
import { requireUser } from "../../../../../lib/permissions.js";

async function getOwnedRate(db, userId, id) {
  const rate = await db.prepare("SELECT nr.id, u.property_id FROM nightly_rates nr JOIN units u ON u.id = nr.unit_id JOIN properties p ON p.id = u.property_id JOIN businesses b ON b.id = p.business_id WHERE nr.id = ? AND b.owner_user_id = ? AND b.status = 'active'").bind(id, userId).first();
  if (!rate) throw new Error("forbidden");
  return rate;
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const startsOn = input.startsOn;
    const endsOn = input.endsOn;
    const amountCentavos = Math.round(Number(input.amountPesos) * 100);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || endsOn <= startsOn || !Number.isInteger(amountCentavos) || amountCentavos < 0) return Response.json({ error: "invalid_rate_input" }, { status: 400 });
    const db = await getDb();
    const rate = await getOwnedRate(db, user.id, id);
    await db.prepare("UPDATE nightly_rates SET starts_on = ?, ends_on = ?, amount_centavos = ? WHERE id = ?").bind(startsOn, endsOn, amountCentavos, id).run();
    return Response.json({ status: "updated", propertyId: rate.property_id });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "rate_update_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    await getOwnedRate(db, user.id, id);
    await db.prepare("DELETE FROM nightly_rates WHERE id = ?").bind(id).run();
    return Response.json({ status: "deleted" });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "forbidden" ? code : "rate_delete_failed" }, { status: code === "forbidden" ? 403 : 500 });
  }
}
