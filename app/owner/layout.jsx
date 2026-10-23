import Link from "next/link";
import { redirect } from "next/navigation";
import { requireServerUser } from "../../lib/permissions.js";

export default async function OwnerLayout({ children }) {
  let user;
  try { user = await requireServerUser(["owner"]); } catch { redirect("/owner/sign-in"); }
  return <div className="min-h-screen bg-stone-50 text-stone-950"><header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/owner" className="font-semibold">Borongan Stays · Owner</Link><nav className="flex gap-4 text-sm"><Link href="/owner/properties" className="hover:underline">Properties</Link><Link href="/owner/reservations" className="hover:underline">Reservations</Link><Link href="/" className="text-stone-600 hover:underline">Public site</Link></nav></div></header><main className="mx-auto max-w-6xl px-5 py-10 lg:px-8"><p className="mb-8 text-sm text-stone-600">Signed in as {user.email}</p>{children}</main></div>;
}
