import { betterAuth } from "better-auth";
import { getBindings, getRequiredSecret } from "./env.js";
import { sendEmail } from "./email.js";

export async function createAuth() {
  const { db } = await getBindings();
  const baseURL = await getRequiredSecret("NEXT_PUBLIC_APP_URL");
  const secret = await getRequiredSecret("BETTER_AUTH_SECRET");
  const secureCookies = baseURL.startsWith("https://");
  return betterAuth({
    database: db,
    baseURL,
    secret,
    trustedOrigins: [baseURL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => sendEmail({
        to: user.email,
        subject: "Reset your Borongan Stays password",
        html: `<p>Reset your password using this link:</p><p><a href="${url}">${url}</a></p>`,
      }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => sendEmail({
        to: user.email,
        subject: "Verify your Borongan Stays email",
        html: `<p>Verify your email using this link:</p><p><a href="${url}">${url}</a></p>`,
      }),
    },
    advanced: {
      useSecureCookies: secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: secureCookies },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  });
}
