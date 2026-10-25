import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toPostgresSql } from "../../lib/db.js";

test("Neon schema uses PostgreSQL tables and Neon-owned storage", () => {
  const schema = readFileSync(new URL("../../neon/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS \"user\"/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS reservations/);
  assert.match(schema, /CHECK \(check_out > check_in\)/);
  assert.match(schema, /image_data BYTEA/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS rate_limit_buckets/);
  assert.doesNotMatch(schema, /PRAGMA|INSERT OR IGNORE|date\('now'\)|R2|RATE_LIMITS/);
});

test("Cloudflare config has no external database or object-storage bindings", () => {
  const config = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  assert.doesNotMatch(config, /r2_buckets|kv_namespaces|RATE_LIMITS|IMAGES/);
});

test("database adapter converts application placeholders to PostgreSQL placeholders", () => {
  assert.equal(toPostgresSql("SELECT * FROM reservations WHERE id = ? AND status = ?"), "SELECT * FROM reservations WHERE id = $1 AND status = $2");
});
