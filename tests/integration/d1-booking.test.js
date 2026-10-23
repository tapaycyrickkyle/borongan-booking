import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

function migratedDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const file of ["0001_better_auth.sql", "0002_marketplace.sql", "0003_indexes_and_constraints.sql"]) {
    db.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  return db;
}

test("local D1 schema accepts a reservation and rejects invalid status/duplicate snapshots", () => {
  const db = migratedDatabase();
  db.prepare("INSERT INTO \"user\" (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)").run("owner-1", "Owner", "owner@example.com");
  db.prepare("INSERT INTO profiles (id, display_name) VALUES (?, ?)").run("owner-1", "Owner");
  db.prepare("INSERT INTO businesses (id, owner_user_id, name, slug, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)").run("business-1", "owner-1", "Borongan Stay", "borongan-stay", "owner@example.com", "09000000000");
  db.prepare("INSERT INTO properties (id, business_id, slug, title, property_type, rental_mode, location_text, description, capacity, house_rules, cancellation_policy, publication_status) VALUES (?, ?, ?, ?, 'room', 'room', ?, ?, 2, ?, ?, 'published')").run("property-1", "business-1", "property-1", "Test Stay", "Borongan City", "Test property", "Quiet hours", "Contact owner");
  db.prepare("INSERT INTO units (id, property_id, name, rental_mode, capacity) VALUES (?, ?, ?, 'room', 2)").run("unit-1", "property-1", "Room 1");
  db.prepare("INSERT INTO reservations (id, reference_number, property_id, unit_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, cancellation_policy_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)").run("reservation-1", "BOR-TEST-1", "property-1", "unit-1", "Guest", "guest@example.com", "09000000001", "2026-11-10", "2026-11-12", "Contact owner");
  assert.throws(() => db.prepare("UPDATE reservations SET status = 'not-a-status' WHERE id = ?").run("reservation-1"));
  db.prepare("INSERT INTO reservation_rate_snapshots (id, reservation_id, stay_date, amount_centavos) VALUES (?, ?, ?, ?)").run("snapshot-1", "reservation-1", "2026-11-10", 250000);
  assert.throws(() => db.prepare("INSERT INTO reservation_rate_snapshots (id, reservation_id, stay_date, amount_centavos) VALUES (?, ?, ?, ?)").run("snapshot-2", "reservation-1", "2026-11-10", 300000));
});
