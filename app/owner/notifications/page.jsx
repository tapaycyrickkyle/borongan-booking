import { getDb } from "../../../lib/db.js";
import { requireServerUser } from "../../../lib/permissions.js";

export const dynamic = "force-dynamic";
export default async function OwnerNotificationsPage() { const user = await requireServerUser(["owner"]); const db = await getDb(); const result = await db.prepare("SELECT * FROM notifications WHERE recipient_user_id = ? ORDER BY created_at DESC LIMIT 50").bind(user.id).all(); return <section><h1 className="text-3xl font-semibold">Notifications</h1><div className="mt-8 divide-y divide-stone-200 border border-stone-200 bg-white">{(result.results ?? []).map((notification) => <article key={notification.id} className="p-5"><p className="font-medium">{notification.title}</p><p className="mt-1 text-sm text-stone-600">{notification.body}</p></article>)}</div></section>; }
