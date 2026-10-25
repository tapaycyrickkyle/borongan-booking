import { getDb } from "../../../lib/db.js";
import { ensureBusiness } from "../../../lib/owner.js";
import { requireServerUser } from "../../../lib/permissions.js";
import BusinessLogoForm from "../../../components/owner/business-logo-form.jsx";

export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const user = await requireServerUser(["owner"]);
  const db = await getDb();
  const business = await ensureBusiness(db, user);
  const businessName = business.name;
  return <section className="max-w-3xl"><h1 className="text-3xl font-semibold">Settings</h1><p className="mt-3 text-stone-600">Manage the business identity shown on your public accommodation listings.</p><div className="mt-8"><BusinessLogoForm businessName={businessName} logoUrl={business?.logo_object_key ? `/api/images/${business.logo_object_key}` : ""} /></div></section>;
}
