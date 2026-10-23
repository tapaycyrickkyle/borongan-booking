import { randomUUID } from "node:crypto";

export async function ensureBusiness(db, user) {
  let business = await db.prepare("SELECT * FROM businesses WHERE owner_user_id = ?").bind(user.id).first();
  if (business) return business;
  const id = randomUUID();
  const slug = `business-${user.id.slice(0, 8)}`;
  await db.prepare("INSERT INTO businesses (id, owner_user_id, name, slug, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, `${user.name || "Owner"}'s stays`, slug, user.email, "")
    .run();
  return db.prepare("SELECT * FROM businesses WHERE id = ?").bind(id).first();
}

export async function getOwnerBusiness(db, userId) {
  return db.prepare("SELECT * FROM businesses WHERE owner_user_id = ? AND status = 'active'").bind(userId).first();
}
