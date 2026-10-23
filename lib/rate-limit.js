import { getBindings } from "./env.js";

export async function consumeRateLimit({ scope, identifier, limit = 10, windowSeconds = 900 }) {
  const { rateLimits } = await getBindings();
  if (!rateLimits) throw new Error("missing_binding:RATE_LIMITS");
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${scope}:${identifier}:${bucket}`;
  const current = Number(await rateLimits.get(key) ?? "0");
  if (current >= limit) return { allowed: false, remaining: 0 };
  await rateLimits.put(key, String(current + 1), { expirationTtl: windowSeconds });
  return { allowed: true, remaining: limit - current - 1 };
}
