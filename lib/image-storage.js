import { randomUUID } from "node:crypto";
import { getDb } from "./db.js";
import { validateImageUpload } from "./validation.js";
import { assertPropertyOwner } from "./permissions.js";

function safeKey(key) {
  return typeof key === "string" && key.length < 300 && !key.split("/").some((part) => part === ".." || part === "." || part.length === 0);
}

function normalizeImageData(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value === "string" && value.startsWith("\\x")) {
    const hex = value.slice(2);
    const bytes = new Uint8Array(Math.floor(hex.length / 2));
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    return bytes;
  }
  return null;
}

async function readUpload(file) {
  validateImageUpload(file);
  return {
    data: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    byteLength: file.size,
  };
}

export async function storeImage({ file, ownerId, propertyId, unitId = null }) {
  const upload = await readUpload(file);
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
  const id = randomUUID();
  await db.prepare(`INSERT INTO ${table} (id, ${unitId ? "unit_id" : "property_id"}, object_key, image_data, content_type, alt_text, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, unitId ?? propertyId, key, upload.data, upload.contentType, file.name || "Accommodation image", Number(count?.count ?? 0)).run();
  return { key, contentType: upload.contentType, byteLength: upload.byteLength };
}

export async function storeBusinessLogo({ file, ownerId }) {
  const upload = await readUpload(file);
  const db = await getDb();
  const business = await db.prepare("SELECT id, name FROM businesses WHERE owner_user_id = ? AND status = 'active'").bind(ownerId).first();
  if (!business) throw new Error("forbidden");
  const key = `businesses/${business.id}/logo/${randomUUID()}`;
  await db.prepare("UPDATE businesses SET logo_object_key = ?, logo_data = ?, logo_content_type = ?, logo_alt_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(key, upload.data, upload.contentType, `${business.name} logo`, business.id).run();
  return { key, contentType: upload.contentType, byteLength: upload.byteLength };
}

export async function readImage({ key, viewer = null }) {
  if (!safeKey(key)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  let image = await db.prepare(`
    SELECT pi.object_key, pi.image_data, pi.content_type, p.publication_status, p.business_id, b.owner_user_id
    FROM property_images pi JOIN properties p ON p.id = pi.property_id JOIN businesses b ON b.id = p.business_id
    WHERE pi.object_key = ? AND pi.moderation_status = 'active'
    UNION ALL
    SELECT ui.object_key, ui.image_data, ui.content_type, p.publication_status, p.business_id, b.owner_user_id
    FROM unit_images ui JOIN units u ON u.id = ui.unit_id JOIN properties p ON p.id = u.property_id JOIN businesses b ON b.id = p.business_id
    WHERE ui.object_key = ? AND ui.moderation_status = 'active'
  `).bind(key, key).first();
  if (!image) {
    image = await db.prepare(`
      SELECT b.logo_object_key AS object_key, b.logo_data AS image_data, b.logo_content_type AS content_type,
             CASE WHEN EXISTS (
               SELECT 1 FROM properties p WHERE p.business_id = b.id AND p.publication_status = 'published' AND p.archived_at IS NULL
             ) THEN 'published' ELSE 'draft' END AS publication_status,
             b.id AS business_id, b.owner_user_id
      FROM businesses b
      WHERE b.logo_object_key = ? AND b.status = 'active'
    `).bind(key).first();
  }
  if (!image?.image_data) return new Response("Not found", { status: 404 });
  const publicAccess = image.publication_status === "published";
  const privateAccess = viewer && (viewer.role === "admin" || (viewer.role === "owner" && viewer.id === image.owner_user_id));
  if (!publicAccess && !privateAccess) return new Response("Not found", { status: 404 });
  const body = normalizeImageData(image.image_data);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    headers: {
      "Content-Type": image.content_type || "application/octet-stream",
      "Content-Length": String(body.byteLength),
      "Cache-Control": publicAccess ? "public, max-age=3600" : "private, no-store",
    },
  });
}
