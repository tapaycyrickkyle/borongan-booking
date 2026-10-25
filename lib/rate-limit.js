import { getDb } from "./db.js";

export async function consumeRateLimit({ scope, identifier, limit = 10, windowSeconds = 900 }) {
  if (!scope || !identifier || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("invalid_rate_limit");
  }
  const db = await getDb();
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  await db.prepare("DELETE FROM rate_limit_buckets WHERE scope = ? AND identifier = ? AND expires_at < CURRENT_TIMESTAMP")
    .bind(scope, identifier).run();
  const row = await db.prepare(`
    INSERT INTO rate_limit_buckets (scope, identifier, bucket, count, expires_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP + (? * INTERVAL '1 second'))
    ON CONFLICT (scope, identifier, bucket)
    DO UPDATE SET count = rate_limit_buckets.count + 1, expires_at = EXCLUDED.expires_at
    WHERE rate_limit_buckets.count < ?
    RETURNING count
  `).bind(scope, identifier, bucket, windowSeconds, limit).first();
  if (!row) return { allowed: false, remaining: 0 };
  const current = Number(row.count);
  return { allowed: true, remaining: Math.max(0, limit - current) };
}
