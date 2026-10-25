import Link from "next/link";
import { redirect } from "next/navigation";
import { requireServerUser } from "../../lib/permissions.js";

export default async function AdminLayout({ children }) { try { await requireServerUser(["admin"]); } catch { redirect("/owner/sign-in"); } return <div className="min-h-screen bg-stone-50 text-stone-950"><header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/admin" className="font-semibold">Booking Borongan · Admin</Link><nav className="flex gap-4 text-sm"><Link href="/admin/properties">Properties</Link><Link href="/admin/reservations">Reservations</Link><Link href="/admin/reports">Reports</Link><Link href="/admin/audit-logs">Audit logs</Link></nav></div></header><main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">{children}</main></div>; }
