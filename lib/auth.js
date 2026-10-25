import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { betterAuth } from "better-auth/minimal";
import { getRequiredSecret } from "./env.js";
import { authSchema } from "./auth-schema.js";

export async function createAuth() {
  const baseURL = await getRequiredSecret("NEXT_PUBLIC_APP_URL");
  const secret = await getRequiredSecret("BETTER_AUTH_SECRET");
  const connectionString = await getRequiredSecret("NEON_DATABASE_URL");
  const database = drizzle(neon(connectionString), { schema: authSchema });
  const secureCookies = baseURL.startsWith("https://");
  return betterAuth({
    database: drizzleAdapter(database, { provider: "pg", schema: authSchema, transaction: true }),
    baseURL,
    secret,
    trustedOrigins: [baseURL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    advanced: {
      useSecureCookies: secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: secureCookies },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  });
}
