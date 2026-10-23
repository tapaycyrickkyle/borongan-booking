import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sql = `
INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES
  ('seed-admin', 'Local Admin', 'admin.local@example.test', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-owner', 'Local Owner', 'owner.local@example.test', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO profiles (id, display_name, role) VALUES ('seed-admin', 'Local Admin', 'admin'), ('seed-owner', 'Local Owner', 'owner');
INSERT OR IGNORE INTO businesses (id, owner_user_id, name, slug, description, contact_email, contact_phone) VALUES ('seed-business', 'seed-owner', 'Borongan Sample Stays', 'borongan-sample-stays', 'Local-only sample business', 'owner.local@example.test', '09000000000');
INSERT OR IGNORE INTO properties (id, business_id, slug, title, property_type, rental_mode, location_text, description, capacity, house_rules, cancellation_policy, publication_status, approved_by, approved_at) VALUES
  ('seed-property', 'seed-business', 'sample-room', 'Sample Room', 'room', 'room', 'Borongan City, Eastern Samar', 'Local-only sample listing for preview.', 2, 'Keep quiet after 10 PM.', 'Contact the owner before checkout.', 'published', 'seed-admin', CURRENT_TIMESTAMP),
  ('seed-property-entire', 'seed-business', 'sample-entire-property', 'Sample Entire Property', 'transient_house', 'entire_property', 'Borongan City, Eastern Samar', 'Local-only sample entire-property listing.', 6, 'No smoking indoors.', 'Contact the owner before checkout.', 'published', 'seed-admin', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO units (id, property_id, name, rental_mode, capacity) VALUES ('seed-room', 'seed-property', 'Room 1', 'room', 2), ('seed-entire-unit', 'seed-property-entire', 'Entire property', 'entire_property', 6);
INSERT OR IGNORE INTO nightly_rates (id, unit_id, starts_on, ends_on, amount_centavos) VALUES ('seed-room-rate', 'seed-room', '2026-01-01', '2027-01-01', 250000), ('seed-entire-rate', 'seed-entire-unit', '2026-01-01', '2027-01-01', 900000);
INSERT OR IGNORE INTO amenities (id, name) VALUES ('seed-wifi', 'Wi-Fi'), ('seed-parking', 'Parking');
INSERT OR IGNORE INTO property_amenities (property_id, amenity_id) VALUES ('seed-property', 'seed-wifi'), ('seed-property-entire', 'seed-parking');
`;

const directory = mkdtempSync(join(tmpdir(), "borongan-seed-"));
const file = join(directory, "seed.sql");
writeFileSync(file, sql, "utf8");
const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", "d1", "execute", "boronganbooking-db", "--local", "--config", "wrangler.jsonc", "--file", file], { stdio: "inherit", shell: true });
rmSync(directory, { recursive: true, force: true });
process.exit(result.status ?? 1);
