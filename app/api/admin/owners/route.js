import { createAuth } from "../../../../lib/auth.js";
import { getDb } from "../../../../lib/db.js";
import { requireUser } from "../../../../lib/permissions.js";

function errorResponse(error, fallback = "forbidden") {
  const code = error?.body?.code || error?.code || "";
  const message = String(error?.message || "");
  if (message === "unauthorized" || message === "forbidden") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (String(code).includes("USER_ALREADY_EXISTS") || message.includes("already exists")) {
    return Response.json({ error: "owner_exists" }, { status: 409 });
  }
  return Response.json({ error: fallback }, { status: fallback === "forbidden" ? 403 : 400 });
}

export async function GET(request) {
  try {
    await requireUser(request, ["admin"]);
    const db = await getDb();
    const result = await db.prepare(`
      SELECT u.id, u.name, u.email, u."createdAt" AS created_at,
             COALESCE(p.is_active, 1) AS is_active,
             COUNT(b.id) AS business_count
      FROM "user" u
      LEFT JOIN profiles p ON p.id = u.id
      LEFT JOIN businesses b ON b.owner_user_id = u.id
      WHERE COALESCE(p.role, 'owner') = 'owner'
      GROUP BY u.id, u.name, u.email, u."createdAt", p.is_active
      ORDER BY u."createdAt" DESC
    `).all();
    return Response.json({ owners: result.results ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireUser(request, ["admin"]);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!name || name.length > 120 || !email || email.length > 254 || password.length < 8 || password.length > 128) {
      return Response.json({ error: "invalid_owner_details" }, { status: 400 });
    }

    const auth = await createAuth();
    const result = await auth.api.signUpEmail({ body: { name, email, password } });
    const createdUser = result?.user;
    if (!createdUser?.id) return Response.json({ error: "owner_creation_failed" }, { status: 400 });

    const db = await getDb();
    await db.batch([
      db.prepare("INSERT INTO profiles (id, display_name, role, is_active) VALUES (?, ?, 'owner', 1)").bind(createdUser.id, name),
      db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'owner.created', 'user', ?, ?)").bind(crypto.randomUUID(), admin.id, createdUser.id, JSON.stringify({ email })),
    ]);
    return Response.json({ owner: { id: createdUser.id, name, email, is_active: 1, business_count: 0 } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "owner_creation_failed");
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireUser(request, ["admin"]);
    const { id, status } = await request.json();
    if (!id || !["active", "suspended"].includes(status)) return Response.json({ error: "invalid_status" }, { status: 400 });

    const db = await getDb();
    const owner = await db.prepare(`
      SELECT u.id
      FROM "user" u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.id = ? AND COALESCE(p.role, 'owner') = 'owner'
    `).bind(id).first();
    if (!owner) return Response.json({ error: "owner_not_found" }, { status: 404 });

    const isActive = status === "active" ? 1 : 0;
    await db.batch([
      db.prepare(`
        INSERT INTO profiles (id, display_name, role, is_active)
        SELECT id, name, 'owner', ? FROM "user" WHERE id = ?
        ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP
      `).bind(isActive, id),
      db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), admin.id, `owner.${status}`, id, JSON.stringify({ status })),
    ]);
    return Response.json({ status });
  } catch (error) {
    return errorResponse(error);
  }
}
