import { randomUUID } from "node:crypto";
import { getBindings } from "./env.js";
import { getDb } from "./db.js";
import { validateImageUpload } from "./validation.js";
import { assertPropertyOwner } from "./permissions.js";

function safeKey(key) {
  return typeof key === "string" && key.length < 300 && !key.split("/").some((part) => part === ".." || part === "." || part.length === 0);
}

export async function storeImage({ file, ownerId, propertyId, unitId = null }) {
  validateImageUpload(file);
  const db = await getDb();
  await assertPropertyOwner(db, ownerId, propertyId);
  const table = unitId ? "unit_images" : "property_images";
  if (unitId) {
    const unit = await db.prepare("SELECT id FROM units WHERE id = ? AND property_id = ? AND is_active = 1").bind(unitId, propertyId).first();
    if (!unit) throw new Error("not_found");
  }
  const count = await db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${unitId ? "unit_id" : "property_id"} = ? AND moderation_status = 'active'`).bind(unitId ?? propertyId).first();
  if (Number(count?.count ?? 0) >= 15) throw new Error("image_limit_reached");
  const key = `${unitId ? "units" : "properties"}/${unitId ?? propertyId}/${randomUUID()}`;
  const { images } = await getBindings();
  if (!images) throw new Error("missing_binding:IMAGES");
  await images.put(key, file.stream ? file.stream() : await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const id = randomUUID();
  await db.prepare(`INSERT INTO ${table} (id, ${unitId ? "unit_id" : "property_id"}, object_key, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, unitId ?? propertyId, key, file.name || "Accommodation image", Number(count?.count ?? 0)).run();
  return { key, contentType: file.type, byteLength: file.size };
}

export async function readImage({ key, viewer = null }) {
  if (!safeKey(key)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const image = await db.prepare(`
    SELECT pi.object_key, p.publication_status, p.business_id, b.owner_user_id
    FROM property_images pi JOIN properties p ON p.id = pi.property_id JOIN businesses b ON b.id = p.business_id
    WHERE pi.object_key = ? AND pi.moderation_status = 'active'
    UNION ALL
    SELECT ui.object_key, p.publication_status, p.business_id, b.owner_user_id
    FROM unit_images ui JOIN units u ON u.id = ui.unit_id JOIN properties p ON p.id = u.property_id JOIN businesses b ON b.id = p.business_id
    WHERE ui.object_key = ? AND ui.moderation_status = 'active'
  `).bind(key, key).first();
  if (!image) return new Response("Not found", { status: 404 });
  const publicAccess = image.publication_status === "published";
  const privateAccess = viewer && (viewer.role === "admin" || (viewer.role === "owner" && viewer.id === image.owner_user_id));
  if (!publicAccess && !privateAccess) return new Response("Not found", { status: 404 });
  const { images } = await getBindings();
  const object = await images?.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream", "Cache-Control": publicAccess ? "public, max-age=3600" : "private, no-store" } });
}
