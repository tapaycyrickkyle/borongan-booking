import { notFound } from "next/navigation";
import { getDb } from "../../../../lib/db.js";
import { requireServerUser } from "../../../../lib/permissions.js";
import PropertyManager from "../../../../components/owner/property-manager.jsx";

export const dynamic = "force-dynamic";

export default async function ManagePropertyPage({ params }) {
  const user = await requireServerUser(["owner"]);
  const { id } = await params;
  const db = await getDb();
  const property = await db.prepare("SELECT p.* FROM properties p JOIN businesses b ON b.id = p.business_id WHERE p.id = ? AND b.owner_user_id = ? AND p.archived_at IS NULL").bind(id, user.id).first();
  if (!property) notFound();
  const units = await db.prepare("SELECT * FROM units WHERE property_id = ? AND is_active = 1 ORDER BY name").bind(id).all();
  const rates = await db.prepare("SELECT nr.*, u.name AS unit_name FROM nightly_rates nr JOIN units u ON u.id = nr.unit_id WHERE u.property_id = ? AND u.is_active = 1 ORDER BY nr.starts_on, u.name").bind(id).all();
  const blocks = await db.prepare("SELECT bd.*, u.name AS unit_name FROM blocked_dates bd JOIN units u ON u.id = bd.unit_id WHERE u.property_id = ? AND u.is_active = 1 ORDER BY bd.starts_on, u.name").bind(id).all();
  return <section><h1 className="text-3xl font-semibold">{property.title}</h1><p className="mt-3 text-stone-600">Manage the listing details, rooms, nightly rates, and unavailable dates.</p><PropertyManager property={property} units={units.results ?? []} rates={rates.results ?? []} blocks={blocks.results ?? []} /></section>;
}
