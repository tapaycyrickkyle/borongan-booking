import { randomUUID } from "node:crypto";
import { getDb } from "../../../../lib/db.js";
import { requireUser } from "../../../../lib/permissions.js";
import { ensureBusiness } from "../../../../lib/owner.js";

export async function GET(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const db = await getDb();
    const business = await ensureBusiness(db, user);
    const result = await db.prepare("SELECT * FROM properties WHERE business_id = ? AND archived_at IS NULL ORDER BY created_at DESC").bind(business.id).all();
    return Response.json({ properties: result.results ?? [] });
  } catch (error) {
    return Response.json({ error: String(error?.message) === "forbidden" ? "forbidden" : "unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(request, ["owner"]);
    const input = await request.json();
    const required = ["title", "propertyType", "rentalMode", "locationText", "description", "houseRules", "cancellationPolicy"];
    if (required.some((field) => typeof input[field] !== "string" || input[field].trim().length < 2)) throw new Error("invalid_property_input");
    const capacity = Number(input.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) throw new Error("invalid_property_input");
    if (!["transient_house", "apartment", "room"].includes(input.propertyType) || !["room", "entire_property"].includes(input.rentalMode)) throw new Error("invalid_property_input");
    const db = await getDb();
    const business = await ensureBusiness(db, user);
    const id = randomUUID();
    const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${id.slice(0, 8)}`;
    await db.prepare(`INSERT INTO properties (id, business_id, slug, title, property_type, rental_mode, location_text, description, capacity, house_rules, cancellation_policy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, business.id, slug, input.title.trim(), input.propertyType, input.rentalMode, input.locationText.trim(), input.description.trim(), capacity, input.houseRules.trim(), input.cancellationPolicy.trim()).run();
    return Response.json({ id, slug }, { status: 201 });
  } catch (error) {
    const code = String(error?.message);
    return Response.json({ error: code === "invalid_property_input" ? code : "property_create_failed" }, { status: code === "invalid_property_input" ? 400 : 500 });
  }
}
