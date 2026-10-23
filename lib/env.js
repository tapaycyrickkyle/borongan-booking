import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getBindings() {
  const { env, ctx } = await getCloudflareContext({ async: true });
  return {
    db: env.DB,
    images: env.IMAGES,
    rateLimits: env.RATE_LIMITS,
    ctx,
  };
}

export async function getRequiredSecret(name) {
  const { env } = await getCloudflareContext({ async: true });
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing_secret:${name}`);
  }
  return value;
}
