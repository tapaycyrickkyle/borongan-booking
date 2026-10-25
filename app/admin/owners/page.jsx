import { getDb } from "../../../lib/db.js";
import OwnerManager from "../../../components/admin/owner-manager.jsx";

export const dynamic = "force-dynamic";

export default async function AdminOwnersPage() {
  const result = await (await getDb()).prepare(`
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
  return <section><h1 className="text-3xl font-semibold">Owner accounts</h1><p className="mt-3 text-stone-600">Create business-owner logins and control whether they can access the owner portal.</p><OwnerManager initialOwners={result.results ?? []} /></section>;
}
