# Borongan Accommodation Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a JavaScript Next.js accommodation reservation marketplace for Borongan City using OpenNext on Cloudflare Workers, D1, R2, KV, Better Auth, and server-enforced reservation workflows.

**Architecture:** Use the existing Next.js App Router with server-rendered public, owner, and admin pages, route handlers for mutations, and small client components only for interactive forms. Access Cloudflare bindings through `getCloudflareContext`, keep domain rules in server-only modules, and perform reservation approvals through an atomic D1 `batch()` operation.

**Tech Stack:** Next.js 16.4.3, React 19.3.0, JavaScript/JSX, Tailwind CSS 4, `@opennextjs/cloudflare`, Wrangler, Cloudflare D1/R2/KV, Better Auth, Resend HTTP API, and Node’s built-in `node:test` runner.

**Spec:** `docs/superpowers/specs/2026-10-23-borongan-accommodation-marketplace-design.md`

## Global Constraints

- Use OpenNext + Cloudflare Workers; do not switch to vinext or a separate API application during this implementation.
- Use JavaScript/JSX only; remove TypeScript scaffold files and TypeScript-only lint configuration. OpenNext’s adapter config must also remain JavaScript (`open-next.config.mjs`).
- Guest reservations require no account; owners use verified email/password accounts; admins use server-enforced roles.
- Only admin-approved and published properties are public and bookable.
- One reservation covers exactly one rentable unit; multi-room reservations are out of scope.
- Pending reservations never block availability; confirmed, checked-in, and completed reservations do.
- Overlap logic must cover room-versus-room, room-versus-entire-property, and entire-property-versus-any-room conflicts.
- Use inclusive check-in/exclusive checkout dates and `Asia/Manila` for report-period derivation.
- Store PHP monetary values as integer centavos; do not add fees, commissions, payments, invoices, or billing features.
- Keep R2 objects private, validate uploads server-side, and never expose untrusted object paths.
- Do not commit credentials, real email keys, Cloudflare IDs, or local `.dev.vars` values.
- Preserve the user’s existing `AGENTS.md` modification and unrelated worktree changes.

## Review Focus

- Overlapping stay boundaries and shared inventory: checkout on the same date as another check-in is allowed; any other overlap is rejected. Test in Task 3.
- Entire-property reservations conflicting with any child room reservation and vice versa: test in Task 3.
- Owner/admin/wrong-owner authorization: return denial before data mutation and never rely on hidden UI. Test in Tasks 2, 4, and 5.
- Missing, overlapping, or changed nightly rates: pending requests may show an estimate, but approval fails without a complete valid rate snapshot. Test in Task 3.
- Asia/Manila checkout-month reporting and duplicate completion: each completed reservation is counted once. Test in Task 5.

## File Structure

The implementation will organize code by responsibility rather than by one large page or service file:

```text
app/
  (public)/...                 public marketplace and guest tracking pages
  (auth)/...                   owner sign-in, sign-up, verification, reset pages
  owner/...                    owner dashboard pages
  admin/...                    admin dashboard pages
  api/auth/[...all]/route.js   Better Auth handler
  api/reservations/...         guest reservation and cancellation endpoints
  api/owner/...                owner mutations and reads
  api/admin/...                admin mutations, reports, and CSV
  api/images/...               authorized R2 image reads
  api/uploads/...              authorized R2 image uploads
  sitemap.js
  robots.js
lib/
  auth.js                      request-scoped Better Auth factory
  db.js                        D1 binding access and prepared-query helpers
  env.js                       Cloudflare binding and secret access
  dates.js                     date parsing, interval, and timezone helpers
  validation.js                server-side request validation
  availability.js              inventory conflict queries
  pricing.js                   nightly rate resolution and snapshots
  booking.js                   reservation state transitions
  permissions.js               role and ownership checks
  guest-links.js               hashed private-link tokens
  email.js                     fetch-based Resend adapter
  notifications.js             dashboard notification writes
  rate-limit.js                KV soft rate limiting
  r2.js                        validated image storage and reads
  reports.js                   monthly report queries and CSV rows
migrations/
  0001_better_auth.sql
  0002_marketplace.sql
  0003_indexes_and_constraints.sql
tests/
  domain/dates.test.js
  domain/availability.test.js
  domain/pricing.test.js
  domain/booking.test.js
  domain/reports.test.js
  integration/d1-booking.test.js
scripts/
  seed-local.mjs
  smoke-worker.mjs
next.config.mjs
wrangler.jsonc
.env.example
.dev.vars.example
public/_headers
README.md
```

## Implementation Tasks

### Task 1: Convert the starter to JavaScript and configure OpenNext

**Files:**
- Modify: `package.json`
- Rename: `next.config.ts` to `next.config.mjs`
- Rename: `app/layout.tsx` to `app/layout.jsx`
- Rename: `app/page.tsx` to `app/page.jsx`
- Modify: `app/globals.css`
- Modify: `eslint.config.mjs`
- Modify: `.gitignore`
- Create: `wrangler.jsonc`, `.env.example`, `.dev.vars.example`, `public/_headers`
- Modify: `README.md`
- Delete after migration: `tsconfig.json`, `next-env.d.ts`

**Interfaces:**
- Produces package scripts `dev`, `build`, `start`, `lint`, `test:unit`, `build:worker`, `preview`, `deploy`, and `cf-typegen`.
- Produces Cloudflare bindings named `DB`, `IMAGES`, and `RATE_LIMITS` for later server modules.

- [ ] **Step 1: Record the current baseline.**

Run `git status --short`, `npm.cmd run lint`, and `npm.cmd run build`; record failures separately from the user’s existing `AGENTS.md` change.

- [ ] **Step 2: Install the minimum runtime/tooling dependencies.**

Add `@opennextjs/cloudflare`, `better-auth`, and `zod` as runtime dependencies; add `wrangler` as a development dependency. Do not add an icon library or email SDK; use text controls and the Resend HTTP API.

- [ ] **Step 3: Convert the scaffold files to JavaScript.**

Move the root config/layout/page files to `.mjs`/`.jsx`, remove TypeScript-only imports and `eslint-config-next/typescript`, preserve Geist font loading, and remove starter links/logos from the home page.

- [ ] **Step 4: Add OpenNext/Workers configuration.**

Set `wrangler.jsonc` to use `.open-next/worker.js`, `.open-next/assets`, `nodejs_compat`, a compatibility date of `2025-05-05` or later, and the D1/R2/KV bindings. Add the standard immutable cache header for `/_next/static/*`. Create `open-next.config.mjs` with `defineCloudflareConfig()` and pass it through `--openNextConfigPath` because the current adapter CLI requires an OpenNext config file.

- [ ] **Step 5: Add the local setup contract.**

Document required secrets, local `.dev.vars`, D1 migration commands, R2/KV creation, Better Auth first-admin provisioning, `npm.cmd run preview`, and deployment commands. State that real Cloudflare credentials and email-provider configuration are required for live verification.

- [ ] **Step 6: Verify the converted scaffold.**

Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run build:worker`; expected result is a clean JavaScript Next/OpenNext build with no TypeScript files required.

- [ ] **Step 7: Commit the bounded setup change.**

Commit only the listed scaffold/config/documentation files with `chore: configure javascript opennext scaffold`.

### Task 2: Add D1 schema, runtime access, and server validation

**Files:**
- Create: `migrations/0001_better_auth.sql`
- Create: `migrations/0002_marketplace.sql`
- Create: `migrations/0003_indexes_and_constraints.sql`
- Create: `lib/env.js`, `lib/db.js`, `lib/dates.js`, `lib/validation.js`
- Create: `tests/domain/dates.test.js`
- Create: `tests/domain/validation.test.js`
- Modify: `package.json` for the unit-test script

**Interfaces:**
- `getBindings() -> { db, images, rateLimits, ctx }`
- `getRequiredSecret(name) -> string`
- `parseStayDates(checkIn, checkOut) -> { checkIn, checkOut, nights }`
- `overlaps(firstStart, firstEnd, secondStart, secondEnd) -> boolean`
- `validateReservationInput(input) -> normalizedInput`
- `validateImageUpload(file) -> { contentType, byteLength }`

- [ ] **Step 1: Write date and validation tests first.**

Cover valid/invalid date order, checkout-exclusive boundaries, leap-day handling, guest-count bounds, allowed property/rental types, PHP centavo normalization, and image MIME/size rejection.

- [ ] **Step 2: Generate and review Better Auth’s D1 schema.**

Use the installed Better Auth CLI to generate the current D1-compatible auth tables, inspect the SQL, and commit the resulting schema as `0001_better_auth.sql` rather than creating auth tables dynamically at request time.

- [ ] **Step 3: Create marketplace tables.**

Add profiles, businesses, properties, units, amenities, property/unit amenity joins, property/unit images, nightly rates, special rates, blocked dates, reservations, reservation status history, guest access tokens, notifications, and audit logs with foreign keys, constrained status values, timestamps, and soft-delete/archive fields where the design requires them.

- [ ] **Step 4: Add indexes and uniqueness constraints.**

Index owner/business/property relationships, publication status, reservation dates/status, report filters, token hashes, and notification read state. Add unique constraints for slugs, references, email identity, and one-time status-history idempotency keys.

- [ ] **Step 5: Implement runtime binding access and validators.**

Read bindings only through `getCloudflareContext`; reject missing production secrets; use prepared statements for all user values; normalize dates and text once at the trust boundary.

- [ ] **Step 6: Run unit tests and local migrations.**

Run `npm.cmd run test:unit` and apply migrations to a local D1 database with Wrangler. Expected result: all validation tests pass and all tables/indexes apply without errors.

- [ ] **Step 7: Commit the schema/runtime foundation.**

Commit migrations, runtime helpers, validators, and tests with `feat: add d1 marketplace schema and validation`.

### Task 3: Implement authentication, roles, availability, pricing, and guest reservations

**Files:**
- Create: `lib/auth.js`, `lib/permissions.js`, `lib/availability.js`, `lib/pricing.js`, `lib/booking.js`, `lib/guest-links.js`, `lib/email.js`, `lib/notifications.js`, `lib/rate-limit.js`
- Create: `app/api/auth/[...all]/route.js`, `proxy.js`
- Create: `app/api/reservations/route.js`, `app/api/reservations/[reference]/route.js`, `app/api/reservations/[reference]/cancellation/route.js`
- Create: `tests/domain/availability.test.js`, `tests/domain/pricing.test.js`, `tests/domain/booking.test.js`
- Create: `tests/integration/d1-booking.test.js`

**Interfaces:**
- `createAuth() -> BetterAuthInstance`
- `requireUser(request, roles?) -> authenticatedUser`
- `assertBusinessOwner(userId, businessId) -> void`
- `getAvailableUnits(db, filters) -> units[]`
- `resolveReservationPrice(db, { unitId, checkIn, checkOut }) -> priceSnapshot`
- `createGuestReservation(input, request) -> { reference, accessUrl }`
- `approveReservation({ db, reservationId, actorUserId }) -> { status: "confirmed" } | { status: "conflict", conflicts }`
- `transitionReservation({ db, reservationId, actorUserId, nextStatus, reason }) -> reservation`
- `issueGuestLink({ reservationId, purpose }) -> rawToken`

- [ ] **Step 1: Write domain tests first.**

Test room-room, room-entire-property, entire-property-room, and entire-property-entire-property conflicts; same-day checkout/check-in allowance; missing-rate rejection; special-rate precedence; valid status transitions; duplicate completion rejection; and cancellation-request transitions.

- [ ] **Step 2: Configure Better Auth.**

Create a request-scoped auth factory using the D1 binding, email/password sign-up, required verification, password reset, secure cookies, session expiry, and Resend callbacks. Mount it at `/api/auth/[...all]`. Use `proxy.js` only for optimistic cookie redirects; every page and mutation repeats the server-side session and role check.

- [ ] **Step 3: Implement permission helpers and rate limits.**

Enforce `owner` and `admin` roles, business ownership, active account state, and published-listing rules in server modules. Add KV fixed-window limits for auth, guest-link, and public reservation endpoints; return generic responses where enumeration is a risk.

- [ ] **Step 4: Implement availability and pricing.**

Use prepared D1 queries for blocking reservations and manual blocks. Resolve base rates plus special-date overrides across every requested night, returning a complete snapshot or a clear missing-rate error.

- [ ] **Step 5: Implement guest reservation creation and private links.**

Validate guest fields and stay dates, verify the selected unit is published/bookable, create a pending reservation/reference, hash and store the guest token, create owner notifications, and send the guest receipt without blocking the reservation write on email delivery.

- [ ] **Step 6: Implement atomic owner approval and status transitions.**

For approval, re-check ownership, state, rates, and overlaps inside one D1 `batch()` containing the status update, price snapshot, history row, audit row, and notification row. Return a conflict without mutation. Enforce check-in on/after check-in, no-show on/after check-in, completion only after checkout, and idempotent completion.

- [ ] **Step 7: Implement guest detail and cancellation endpoints.**

Require a valid unexpired hashed token, return only that reservation’s safe fields, allow cancellation requests until checkout, and keep cancellation pending until the owner decides. Support issuing a replacement link only after matching reference/email checks and rate limiting.

- [ ] **Step 8: Run domain/integration checks.**

Run `npm.cmd run test:unit` and the local D1 booking integration test. Expected results include no double approval under repeated requests, no cross-unit conflict bypass, no duplicate completion, and no unauthorized data access.

- [ ] **Step 9: Commit the core workflow.**

Commit with `feat: add authenticated booking and reservation integrity`.

### Task 4: Build the public marketplace and guest-facing UI

**Files:**
- Create: `app/(public)/layout.jsx`, `app/(public)/page.jsx`, `app/(public)/search/page.jsx`, `app/(public)/listings/[slug]/page.jsx`, `app/(public)/reservations/[reference]/page.jsx`
- Create: `components/public/search-form.jsx`, `components/public/listing-card.jsx`, `components/public/availability-panel.jsx`, `components/public/reservation-form.jsx`, `components/public/guest-reservation-view.jsx`
- Modify: `app/globals.css`, `app/layout.jsx`
- Create: `app/not-found.jsx`, `app/error.jsx`

**Interfaces:**
- Public server queries consume `getAvailableUnits` and published-listing filters from Task 3.
- Client forms submit to the route handlers from Task 3 and display field-level/server outcomes without duplicating authorization or availability logic.

- [ ] **Step 1: Add public page tests/check fixtures.**

Create fixture data for one published property, one draft property, one room, and one entire-property unit; assert only the published property is returned by public queries.

- [ ] **Step 2: Build search and listing detail pages.**

Render location, dates, guest count, property type, rental mode, and PHP price filters with URL query state. Show photo, amenities, description, rules, location text, resolved nightly price, and availability without fabricated ratings/reviews.

- [ ] **Step 3: Build the guest reservation form.**

Provide labeled name, email, phone, guest count, check-in, and checkout fields with native types, field errors, preserved input, pending state, success reference, and private-link handoff.

- [ ] **Step 4: Build private reservation tracking and cancellation request UI.**

Show only token-authorized details, status history relevant to the guest, owner contact guidance, and cancellation-request feedback. Do not expose internal audit metadata or other bookings.

- [ ] **Step 5: Verify responsive/accessibility behavior.**

Check keyboard operation, visible focus, labels, contrast, mobile layouts, error announcements, no-data states, and reduced-motion behavior. Run lint and the production build.

- [ ] **Step 6: Commit public UI.**

Commit with `feat: add public accommodation marketplace and guest tracking`.

### Task 5: Build the owner portal, property management, and R2 images

**Files:**
- Create: `app/(auth)/owner/sign-in/page.jsx`, `app/(auth)/owner/sign-up/page.jsx`, `app/(auth)/owner/verify/page.jsx`, `app/(auth)/owner/forgot-password/page.jsx`, `app/(auth)/owner/reset-password/page.jsx`
- Create: `app/owner/layout.jsx`, `app/owner/page.jsx`, `app/owner/properties/page.jsx`, `app/owner/properties/new/page.jsx`, `app/owner/properties/[id]/page.jsx`, `app/owner/reservations/page.jsx`, `app/owner/calendar/page.jsx`, `app/owner/notifications/page.jsx`, `app/owner/settings/page.jsx`
- Create: `components/owner/property-form.jsx`, `components/owner/unit-form.jsx`, `components/owner/rates-editor.jsx`, `components/owner/calendar.jsx`, `components/owner/reservation-actions.jsx`
- Create: `app/api/owner/properties/route.js`, `app/api/owner/properties/[id]/route.js`, `app/api/owner/units/route.js`, `app/api/owner/rates/route.js`, `app/api/owner/blocks/route.js`, `app/api/owner/reservations/[id]/route.js`, `app/api/owner/uploads/route.js`
- Create: `lib/r2.js`, `app/api/images/[...key]/route.js`

**Interfaces:**
- Owner pages consume `requireUser(request, ["owner"])` and owner-scoped queries.
- `storeImage({ file, ownerId, propertyId, unitId }) -> { key, contentType, byteLength }`
- `readImage({ key, viewer }) -> Response`

- [ ] **Step 1: Add auth form tests.**

Cover required fields, password bounds, generic duplicate-email behavior, verified-email gate, reset-link success/failure, and redirect behavior for unauthenticated users.

- [ ] **Step 2: Implement owner authentication pages.**

Use Better Auth client actions for sign-up/sign-in/sign-out/reset flows. Show verification and reset outcomes without exposing whether another email exists.

- [ ] **Step 3: Implement business/property/unit CRUD.**

Scope every query to the active owner’s business, allow drafts, require the approved v1 fields and at least one image before submission, and return published content edits to review when required by the design.

- [ ] **Step 4: Implement rates, special rates, and manual blocks.**

Validate non-overlapping effective ranges where required, preserve history through audit rows, and show remaining availability impacts before saving a block.

- [ ] **Step 5: Implement owner reservation actions.**

Show pending requests and conflict explanations; connect approval, decline, cancellation decision, check-in, completion, and no-show controls to the server transitions from Task 3. Display the checkout requirement for completion.

- [ ] **Step 6: Implement R2 upload/read paths.**

Validate JPEG/PNG/WebP, maximum 10 MB, image dimensions/bytes, and owner/property scope before writing private keys. Stream public images only when the property is published; require owner/admin authorization otherwise.

- [ ] **Step 7: Add owner dashboard/calendar/notifications.**

Provide compact counts, reservation lists, monthly completed stays, blocked-date calendar, read/unread notifications, and empty/error/loading states.

- [ ] **Step 8: Verify wrong-owner and upload isolation.**

Run route tests proving a second owner cannot read, edit, approve, upload to, or delete another owner’s property, unit, reservation, block, rate, or image.

- [ ] **Step 9: Commit the owner portal.**

Commit with `feat: add owner property and reservation portal`.

### Task 6: Build admin controls, reports, CSV export, SEO, and public metadata

**Files:**
- Create: `app/admin/layout.jsx`, `app/admin/page.jsx`, `app/admin/businesses/page.jsx`, `app/admin/properties/page.jsx`, `app/admin/reservations/page.jsx`, `app/admin/reports/page.jsx`, `app/admin/audit-logs/page.jsx`
- Create: `components/admin/report-filters.jsx`, `components/admin/report-table.jsx`, `components/admin/approval-actions.jsx`
- Create: `app/api/admin/businesses/[id]/route.js`, `app/api/admin/properties/[id]/route.js`, `app/api/admin/reports/monthly/route.js`, `app/api/admin/reports/monthly.csv/route.js`, `app/api/admin/audit-logs/route.js`
- Create: `lib/reports.js`, `app/sitemap.js`, `app/robots.js`

**Interfaces:**
- `getMonthlyReport(db, { year, month, businessId, status }) -> reportRows`
- `toCsv(reportRows) -> string`
- Admin routes consume `requireUser(request, ["admin"])` and return no owner/private data beyond the requested admin view.

- [ ] **Step 1: Write report tests first.**

Cover checkout-date month selection in Asia/Manila, grouping multiple properties under one business, separate status counts, filtering, CSV escaping, and one-count-only completed reservations.

- [ ] **Step 2: Implement admin authorization and listing moderation.**

Provision the first admin through the documented setup path, restrict all admin routes server-side, and implement business/property approve/reject/suspend actions with reasons and audit records.

- [ ] **Step 3: Implement reservation monitoring and audit views.**

Show all reservation statuses, safe guest contact fields needed for operations, immutable status history, actor, reason, and timestamps. Keep normal admin controls read-only for reservation state.

- [ ] **Step 4: Implement monthly report query and CSV route.**

Use one server query for the visible report and CSV export. Count completed reservations once by checkout month, group by business, support month/year/business/status filters, and set a download content disposition.

- [ ] **Step 5: Add SEO metadata and structured data.**

Set stable site metadata, listing-specific metadata, canonical URLs, `robots.js`, and a sitemap containing only published listings and public pages. Do not index owner/admin/private reservation pages.

- [ ] **Step 6: Verify admin isolation and reports.**

Run admin route tests for non-admin denial, property moderation, audit writes, report filters, and CSV equivalence with the table query.

- [ ] **Step 7: Commit admin/reporting/SEO.**

Commit with `feat: add admin moderation and monthly reports`.

### Task 7: Complete documentation and end-to-end verification

**Files:**
- Modify: `README.md`, `package.json`, `wrangler.jsonc`, `.env.example`, `.dev.vars.example`
- Create: `scripts/seed-local.mjs`, `scripts/smoke-worker.mjs`
- Modify: tests and fixtures only where verification exposes a defect

- [ ] **Step 1: Add local seed data.**

Create deterministic local-only seed data for an admin, owner/business, approved property, room, entire-property unit, amenities, rates, and sample blocked dates. Never seed real people or credentials.

- [ ] **Step 2: Add Worker smoke checks.**

Exercise public listing visibility, reservation creation, guest-link lookup, owner sign-in, approval conflict, admin report access, and CSV response against the local Worker preview.

- [ ] **Step 3: Run the full verification matrix.**

Run, in order:

```powershell
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run build
npm.cmd run build:worker
npm.cmd run preview
```

Use browser verification against the preview for guest, owner, and admin flows. Stop and report any missing Cloudflare/email credentials instead of claiming live behavior.

- [ ] **Step 4: Inspect the final diff and release scope.**

Run `git diff --stat`, `git diff --check`, `git status --short`, and a targeted search for payment/commission/billing terms and secret-like values. Confirm the pre-existing `AGENTS.md` change remains untouched.

- [ ] **Step 5: Commit documentation and verification tooling.**

Commit with `docs: add borongan marketplace setup and verification`.

## Self-review result

The plan covers public search/detail/reservation/tracking, owner registration and verification, property/unit/image/rate/block management, owner reservation lifecycle, admin moderation/monitoring/audit/reporting/CSV, D1/R2/KV/OpenNext configuration, SEO, security boundaries, and the explicit exclusion of payment/commission/billing functionality. The five highest-risk input classes are pinned to tests in Tasks 2, 3, 5, and 6. No implementation code is included in this plan.
