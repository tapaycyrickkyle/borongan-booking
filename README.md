# Booking Borongan

Accommodation reservation marketplace for Borongan City, Eastern Samar.

This JavaScript Next.js App Router project deploys to Cloudflare Workers through OpenNext. Neon PostgreSQL stores application data, uploaded accommodation images, and rate-limit counters. Guests request reservations without accounts or online payments.

## Local development

```powershell
npm.cmd install
Copy-Item .dev.vars.example .dev.vars
npm.cmd run dev
```

Set `NEON_DATABASE_URL` in `.dev.vars` to a development Neon branch. The local preview also needs a Better Auth secret with at least 32 random characters. Do not commit `.dev.vars` or real credentials.

## Checks

```powershell
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run build
npm.cmd run build:worker
```

## Neon and Cloudflare setup

1. Create a Neon project and development/production branches.
2. Run `neon/schema.sql` for the branch used by the Worker. Existing databases should apply the matching file in `migrations/` in order.
3. Log in to Cloudflare with `npx wrangler login`.
4. Add production secrets with `npx wrangler secret put NEON_DATABASE_URL`, `npx wrangler secret put BETTER_AUTH_SECRET`, and `npx wrangler secret put NEXT_PUBLIC_APP_URL`.

OpenNext uses `.open-next/worker.js` as the Worker entrypoint and `open-next.config.mjs` as the JavaScript adapter configuration. Preview the Worker runtime with `npm.cmd run preview`. Deploy only after the Neon schema and secrets are ready with `npm.cmd run deploy`.

## Authentication and first admin

Better Auth handles owner email/password accounts and sessions without outbound email delivery. Guests do not register. Create the first account through the owner sign-up flow, then run this one-time SQL in the Neon SQL Editor to grant admin access. Replace the email with the account you created; admin access is never created through public signup.

```sql
INSERT INTO profiles (id, display_name, role)
SELECT id, name, 'admin' FROM "user" WHERE email = 'admin@example.com'
ON CONFLICT(id) DO UPDATE SET role = 'admin', is_active = 1;
```

Do not paste passwords, session tokens, or guest-link tokens into SQL or logs.

## Local seed and smoke check

After running `neon/schema.sql` on a development branch, set `NEON_DATABASE_URL` to that branch and seed non-production sample listings with:

```powershell
node scripts/seed-local.mjs
```

For a running local Worker preview:

```powershell
$env:SMOKE_BASE_URL = "http://127.0.0.1:8787"
node scripts/smoke-worker.mjs
```

The smoke script checks public routes only. It does not claim that Better Auth, Neon image storage, or Neon rate limiting are working unless those secrets are present in the preview.

## Scope exclusions

This project deliberately does not implement online payments, commissions, fees, invoicing, billing, payment tracking, or overdue reminders.
