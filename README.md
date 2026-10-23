# Borongan Stays

Accommodation reservation marketplace for Borongan City, Eastern Samar.

The application is a JavaScript Next.js App Router project deployed to Cloudflare Workers through OpenNext. D1 stores application data, R2 stores private accommodation images, and KV provides soft rate limiting. Guests request reservations without accounts or online payments.

## Local development

Install dependencies and start Next.js:

```powershell
npm.cmd install
npm.cmd run dev
```

Copy `.dev.vars.example` to `.dev.vars` for local secrets. Do not commit `.dev.vars` or real credentials.

## Checks

```powershell
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run build
```

## Cloudflare setup

1. Log in with `npx wrangler login`.
2. Create a D1 database with `npx wrangler d1 create boronganbooking-db` and put its ID in `wrangler.jsonc`.
3. Create the image bucket with `npx wrangler r2 bucket create boronganbooking-images`.
4. Create a KV namespace with `npx wrangler kv namespace create RATE_LIMITS` and put its ID in `wrangler.jsonc`.
5. Apply migrations with `npx wrangler d1 migrations apply boronganbooking-db --remote`.
6. Add production secrets with `npx wrangler secret put BETTER_AUTH_SECRET`, `npx wrangler secret put RESEND_API_KEY`, and `npx wrangler secret put EMAIL_FROM`.
7. Update the public app URL and email sender after the production domain is known.

OpenNext uses `.open-next/worker.js` as the Worker entrypoint and the JavaScript `open-next.config.mjs` adapter configuration. Preview the Worker runtime with:

```powershell
npm.cmd run preview
```

Deploy only after the D1, R2, KV, secret, and email configuration is ready:

```powershell
npm.cmd run deploy
```

## Authentication and first admin

Better Auth handles owner email/password accounts, verification, password reset, and sessions. Guests do not register. The first administrator is provisioned through the application’s documented setup path after the production database exists; admin access is never created through public signup.

## Scope exclusions

This project deliberately does not implement online payments, commissions, fees, invoicing, billing, payment tracking, or overdue reminders.
