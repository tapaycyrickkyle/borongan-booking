import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("Set NEON_DATABASE_URL to a development Neon branch before seeding.");

const sql = neon(connectionString);
await sql.transaction([
  sql`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ('seed-admin', 'Local Admin', 'admin.local@example.test', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ('seed-owner', 'Local Owner', 'owner.local@example.test', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO profiles (id, display_name, role) VALUES ('seed-admin', 'Local Admin', 'admin'), ('seed-owner', 'Local Owner', 'owner') ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO businesses (id, owner_user_id, name, slug, description, contact_email, contact_phone) VALUES ('seed-business', 'seed-owner', 'Borongan Sample Stays', 'borongan-sample-stays', 'Development-only sample business', 'owner.local@example.test', '09000000000') ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO properties (id, business_id, slug, title, property_type, rental_mode, location_text, description, capacity, house_rules, cancellation_policy, publication_status, approved_by, approved_at) VALUES ('seed-property', 'seed-business', 'sample-room', 'Sample Room', 'room', 'room', 'Borongan City, Eastern Samar', 'Development-only sample listing.', 2, 'Keep quiet after 10 PM.', 'Contact the owner before checkout.', 'published', 'seed-admin', CURRENT_TIMESTAMP), ('seed-property-entire', 'seed-business', 'sample-entire-property', 'Sample Entire Property', 'transient_house', 'entire_property', 'Borongan City, Eastern Samar', 'Development-only sample entire-property listing.', 6, 'No smoking indoors.', 'Contact the owner before checkout.', 'published', 'seed-admin', CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO units (id, property_id, name, rental_mode, capacity) VALUES ('seed-room', 'seed-property', 'Room 1', 'room', 2), ('seed-entire-unit', 'seed-property-entire', 'Entire property', 'entire_property', 6) ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO nightly_rates (id, unit_id, starts_on, ends_on, amount_centavos) VALUES ('seed-room-rate', 'seed-room', '2026-01-01', '2027-01-01', 250000), ('seed-entire-rate', 'seed-entire-unit', '2026-01-01', '2027-01-01', 900000) ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO amenities (id, name) VALUES ('seed-wifi', 'Wi-Fi'), ('seed-parking', 'Parking') ON CONFLICT (id) DO NOTHING`,
  sql`INSERT INTO property_amenities (property_id, amenity_id) VALUES ('seed-property', 'seed-wifi'), ('seed-property-entire', 'seed-parking') ON CONFLICT DO NOTHING`,
]);

console.log("Development seed data inserted into Neon.");
