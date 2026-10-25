import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getExecutionContext() {
  const { ctx } = await getCloudflareContext({ async: true });
  return { ctx };
}

export async function getRequiredSecret(name) {
  const { env } = await getCloudflareContext({ async: true });
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing_secret:${name}`);
  }
  return value;
}
