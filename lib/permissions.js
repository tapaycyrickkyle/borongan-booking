import { createAuth } from "./auth.js";
import { getDb } from "./db.js";

export async function requireUser(request, roles = []) {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) throw new Error("unauthorized");
  const db = await getDb();
  const profile = await db.prepare("SELECT display_name, role, is_active FROM profiles WHERE id = ?").bind(session.user.id).first();
  if (!profile?.is_active || (roles.length && !roles.includes(profile.role))) throw new Error("forbidden");
  return { ...session.user, role: profile.role, displayName: profile.display_name };
}

export async function assertBusinessOwner(db, userId, businessId) {
  const business = await db.prepare("SELECT id FROM businesses WHERE id = ? AND owner_user_id = ? AND status = 'active'").bind(businessId, userId).first();
  if (!business) throw new Error("forbidden");
  return business;
}

export async function assertPropertyOwner(db, userId, propertyId) {
  const business = await db.prepare("SELECT b.id FROM businesses b JOIN properties p ON p.business_id = b.id WHERE p.id = ? AND b.owner_user_id = ? AND b.status = 'active'").bind(propertyId, userId).first();
  if (!business) throw new Error("forbidden");
  return business;
}
