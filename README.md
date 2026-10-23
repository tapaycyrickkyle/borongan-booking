# Borongan Stays

Accommodation reservation marketplace for Borongan City, Eastern Samar.

This JavaScript Next.js App Router project deploys to Cloudflare Workers through OpenNext. D1 stores application data, R2 stores private accommodation images, and KV provides soft rate limiting. Guests request reservations without accounts or online payments.

## Local development

```powershell
npm.cmd install
Copy-Item .dev.vars.example .dev.vars
npm.cmd run dev
```

The local preview needs a Better Auth secret with at least 32 random characters. Leave `RESEND_API_KEY` blank only when you are not testing verification or reservation email delivery. Do not commit `.dev.vars` or real credentials.

## Checks

```powershell
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run build
npm.cmd run build:worker
```

## Cloudflare setup

1. Log in with `npx wrangler login`.
2. Create a D1 database with `npx wrangler d1 create boronganbooking-db` and put its ID in `wrangler.jsonc`.
3. Create the image bucket with `npx wrangler r2 bucket create boronganbooking-images`.
4. Create a KV namespace with `npx wrangler kv namespace create RATE_LIMITS` and put its ID in `wrangler.jsonc`.
5. Apply migrations with `npx wrangler d1 migrations apply boronganbooking-db --remote`.
6. Add production secrets with `npx wrangler secret put BETTER_AUTH_SECRET`, `npx wrangler secret put RESEND_API_KEY`, and `npx wrangler secret put EMAIL_FROM`.
7. Set `NEXT_PUBLIC_APP_URL` in the Worker environment to the final HTTPS URL.

OpenNext uses `.open-next/worker.js` as the Worker entrypoint and `open-next.config.mjs` as the JavaScript adapter configuration. Preview the Worker runtime with `npm.cmd run preview`. Deploy only after D1, R2, KV, secrets, and email configuration are ready with `npm.cmd run deploy`.

## Authentication and first admin

Better Auth handles owner email/password accounts, verification, password reset, and sessions. Guests do not register. Create the first account through the owner sign-up flow, verify its email, then run this one-time SQL in the D1 console to grant admin access. Replace the email with the verified account you created; admin access is never created through public signup.

```sql
INSERT INTO profiles (id, display_name, role)
SELECT id, name, 'admin' FROM "user" WHERE email = 'admin@example.com'
ON CONFLICT(id) DO UPDATE SET role = 'admin', is_active = 1;
```

Do not paste passwords, session tokens, or guest-link tokens into SQL or logs.

## Local seed and smoke check

After applying local migrations, seed non-production sample listings with:

```powershell
node scripts/seed-local.mjs
```

For a running local Worker preview:

```powershell
$env:SMOKE_BASE_URL = "http://127.0.0.1:8787"
node scripts/smoke-worker.mjs
```

The smoke script checks public routes only. It does not claim that Better Auth, Resend, R2, or KV are working unless those bindings and credentials are present in the preview.

## Scope exclusions

This project deliberately does not implement online payments, commissions, fees, invoicing, billing, payment tracking, or overdue reminders.
