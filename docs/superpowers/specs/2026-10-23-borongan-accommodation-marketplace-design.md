# Borongan Accommodation Marketplace Design

## Intent

Build a production-ready accommodation reservation marketplace for Borongan City, Eastern Samar. Guests can discover approved accommodations and submit reservation requests without creating an account or paying online. Owners manage their businesses, listings, availability, and reservation decisions. Administrators control publication, access, monitoring, audit history, and monthly completed-stay reporting.

The source repository is a fresh Next.js 16.4.3 scaffold. The implementation will use JavaScript/JSX, not TypeScript, and will preserve the existing App Router structure while replacing the starter page and configuration.

## Goals

- Public, responsive marketplace for approved and published properties.
- Guest reservation requests with private, secure tracking links.
- Owner registration, verification, property management, availability management, and reservation lifecycle actions.
- Server-enforced administrator permissions, listing approval, reservation monitoring, audit history, and CSV reports.
- Correct date overlap behavior for rooms and entire-property rentals.
- D1-backed persistence, R2-backed image storage, Cloudflare Workers deployment, and transactional email.
- No online payment, commission, invoicing, billing, fee, or financial-agreement features.

## Non-goals and anti-goals

- No guest accounts or guest password management.
- No payment gateway, deposits, commission calculations, invoices, receipts, payment tracking, or overdue reminders.
- No reviews, ratings, fabricated testimonials, or invented business data.
- No real-time chat, multi-tenant staff permissions, calendar synchronization, or automated cancellation refunds unless separately requested.
- No client-only authorization, optimistic booking confirmation, or UI-only availability guarantees.
- No oversized landing-page treatment; the marketplace and dashboards remain compact, task-oriented interfaces.

## Constraints and decisions

- **Deployment:** OpenNext Cloudflare adapter with Wrangler and Cloudflare Workers. This is the selected approach for this project because it preserves standard Next.js behavior for a complex authenticated App Router application. Cloudflare currently recommends vinext for new applications, but vinext remains beta; switching adapters later is explicitly outside this implementation.
- **Runtime:** Use the OpenNext-supported Node.js runtime path. Do not add `runtime = "edge"` to application files.
- **Language:** Convert the starter from TypeScript to JavaScript/JSX. Remove TypeScript-only scaffold files and dependencies once no longer needed.
- **Database:** Cloudflare D1 with SQL migrations, prepared statements, explicit indexes, and `batch()` for atomic reservation state changes.
- **Authentication:** Better Auth with D1 storage, email/password owner accounts, email verification, secure sessions, password reset, and server-side role checks. Guest reservations do not create Better Auth users.
- **Email:** A small fetch-based transactional email adapter, configured for Resend through an environment secret. Email delivery is isolated so the provider can be replaced without changing reservation logic.
- **Images:** Private R2 objects. Authenticated server endpoints validate uploads and write to R2; an authorized image route streams published images publicly and owner/admin images privately. Object keys never come from untrusted paths.
- **Rate limiting:** A small Cloudflare KV namespace for soft per-IP/per-email limits on sign-up, login, password reset, public reservation submission, and guest-link actions. Database authorization and booking integrity do not depend on KV.
- **Dates:** Store calendar dates as ISO `YYYY-MM-DD` values for stays and use `Asia/Manila` when deriving report periods or displaying date-based operational events. Check-in is inclusive and checkout is exclusive for overlap checks.
- **Pricing:** Store nightly base and special-date rates and snapshot the resolved nightly rates on a reservation. There are no service fees, commissions, payment states, invoices, or financial reports.

## Approaches considered

### OpenNext + Cloudflare Workers — selected

Uses standard Next.js build output transformed by `@opennextjs/cloudflare`, with Wrangler, D1, R2, KV, and Worker secrets. It best matches the requested Next.js application and avoids adopting a beta framework implementation for the core authenticated workflows.

Trade-off: Cloudflare’s newest documentation recommends vinext for new applications, and OpenNext build/deployment verification is more reliable under Linux/WSL or CI than native Windows.

### vinext + Cloudflare Workers

Cloudflare’s current recommended path for new Next.js Workers applications. It keeps the App Router and supports Cloudflare bindings, but it is beta and requires compatibility verification for the chosen auth and storage libraries.

Not selected for this phase because production reliability and standard Next.js behavior are higher priorities for the reservation and role-management workflows.

### Separate Next.js frontend and Worker API

Would split UI, API, sessions, and deployment across two applications.

Rejected because it creates a second authentication boundary and more operational surface without helping the stated product requirements.

## Domain model

### Identity and ownership

- `user`, `session`, `account`, and `verification` are Better Auth tables.
- `profiles`: one row per authenticated owner/admin with display name, phone, role, active status, and timestamps.
- `businesses`: accommodation business details, owner user, approval/suspension status, contact details, and policy defaults.
- `audit_logs`: actor, action, entity type/id, safe metadata, request context, and timestamp. Do not store passwords, session secrets, or full guest access tokens.

An owner account owns one business in the first version. Admins can manage all businesses. The schema keeps the business entity separate so report grouping and future staff access do not require changing property ownership.

### Listings and inventory

- `properties`: business, slug, title, property type, address/location text, description, capacity, house rules, cancellation policy, publication state, and approval metadata.
- `units`: rentable inventory under a property. A unit is either an individual room or an entire-property rental.
- `amenities`: controlled amenity catalog.
- `property_amenities` and `unit_amenities`: many-to-many relationships.
- `property_images` and `unit_images`: R2 object key, alt text, sort order, cover flag, and moderation/deletion metadata.
- `nightly_rates`: base rate and effective date range per unit.
- `special_rates`: selected-date or date-range override per unit.
- `blocked_dates`: owner/admin manual blocks for a unit or entire property, with a reason and audit record.

Only properties with `publication_status = published`, an approved owner/business, and valid inventory are returned by public queries.

### Reservations

- `reservations`: reference number, property/unit, guest contact fields, guest count, check-in/out dates, resolved price snapshot, status, cancellation policy snapshot, owner decision metadata, check-in/completion/no-show timestamps, and created/updated timestamps.
- `reservation_status_history`: append-only status transitions with actor and reason.
- `guest_access_tokens`: hashed opaque token, reservation, purpose, expiry, last-used timestamp, revocation timestamp, and usage metadata.
- `notifications`: owner/admin in-dashboard notifications with read state and optional email delivery state.

Reservation statuses are `pending`, `confirmed`, `declined`, `cancellation_requested`, `cancelled`, `checked_in`, `completed`, and `no_show`. A pending reservation never blocks availability. A confirmed, checked-in, or completed reservation blocks its stay dates. A cancellation request does not change availability until approved.

## Availability and booking integrity

The canonical overlap condition is:

```text
existing.check_in < requested.check_out
AND existing.check_out > requested.check_in
```

For a requested room unit, reject approval if an overlapping blocking reservation or block exists for that room or an overlapping entire-property unit under the same property.

For a requested entire-property unit, reject approval if any overlapping blocking reservation or block exists for the entire-property unit or any room unit under the same property.

The approval mutation will:

1. Validate actor role, ownership, property state, date range, guest count, and current reservation status.
2. Read the relevant property inventory and current blocking reservations/blocks.
3. Re-check for overlap inside one D1 `batch()` transaction together with the status update, status-history insert, audit insert, and notification insert.
4. Return a conflict result without changing the reservation when any overlap or state precondition fails.

The database will enforce unique identifiers and indexes. Application overlap checks handle the interval and cross-unit rules that SQLite/D1 cannot express as a simple unique constraint. The approval path is the only path that can change a pending reservation to confirmed.

## Reservation workflows

### Guest

1. Search by location, dates, guest count, property type, and price.
2. Open a published property/unit detail page and view photos, amenities, rules, price, location text, and availability.
3. Submit name, email, phone, guest count, check-in, and checkout.
4. Receive a unique reference number and a private link containing an unpredictable token.
5. View reservation state and details through the private link.
6. Request cancellation through the same link. The request enters `cancellation_requested`; the owner must approve or decline it.

The private token is only stored hashed, expires, can be revoked, and is rate-limited. The guest page never exposes owner/admin controls or unrelated reservation data.

### Owner

- Register, verify email, sign in, reset password, and update profile/business details.
- Create properties, units, amenities, rules, pricing, images, and manual blocks.
- Submit drafts for admin approval and see rejection/suspension reasons.
- Review pending requests, approve or decline, approve/decline cancellation requests, check in, mark completed only after checkout, and mark no-show.
- See calendar, notifications, monthly booking statistics, and completed stays.

Owner mutations always scope queries by the authenticated owner’s business. UI hiding is not treated as authorization.

### Admin

- Sign in through the same secure session system with a server-side admin role.
- Review/approve/reject/suspend businesses and properties.
- Monitor all reservations and history.
- View audit logs and monthly reports.
- Export filtered CSV data.

The first admin is provisioned through a documented one-time setup command or migration procedure, not public registration.

## Monthly reporting

The report filter accepts month, year, business, and reservation status. Completed-stay counts are grouped by business and property and count a reservation once using its scheduled checkout date interpreted in `Asia/Manila`. A completed reservation cannot be completed twice because the completion mutation checks current status and writes one status-history event inside the same transaction.

The report displays separate counts for Pending, Confirmed, Cancelled, Declined, No-show, Checked-in, and Completed. For non-completed statuses, the selected period is the reservation checkout-date month so the table has one consistent stay-period filter. CSV export uses the same server query and authorization as the visible report.

## Route and UI structure

```text
app/
  (public)/
    page.jsx
    search/page.jsx
    listings/[slug]/page.jsx
    reservations/[reference]/page.jsx
  (auth)/
    owner/sign-in/page.jsx
    owner/sign-up/page.jsx
    owner/verify/page.jsx
    owner/forgot-password/page.jsx
    owner/reset-password/page.jsx
  owner/
    layout.jsx
    page.jsx
    properties/page.jsx
    properties/new/page.jsx
    properties/[id]/page.jsx
    reservations/page.jsx
    calendar/page.jsx
    notifications/page.jsx
    settings/page.jsx
  admin/
    layout.jsx
    page.jsx
    businesses/page.jsx
    properties/page.jsx
    reservations/page.jsx
    reports/page.jsx
    audit-logs/page.jsx
  api/
    auth/[...all]/route.js
    reservations/route.js
    reservations/[reference]/route.js
    reservations/[reference]/cancellation/route.js
    owner/*
    admin/*
    images/*
    uploads/*
    reports/monthly.csv/route.js
  sitemap.js
  robots.js
  not-found.jsx
  error.jsx
```

Shared server modules will be small and responsibility-focused:

```text
lib/
  auth.js
  db.js
  env.js
  booking.js
  availability.js
  pricing.js
  reports.js
  permissions.js
  email.js
  r2.js
  rate-limit.js
  validation.js
  dates.js
```

The UI will use Geist Sans/Mono already present in the scaffold, Tailwind utility classes, semantic HTML, visible focus states, compact forms, normal tables, and Lucide icons only where they improve scanning. Public listing images and realistic field labels will be data-driven; no fabricated reviews or business claims will be added.

## Deployment and configuration

Planned files:

- `next.config.mjs`: Next.js configuration plus OpenNext local-development initialization.
- `open-next.config.mjs`: JavaScript-only OpenNext Cloudflare adapter configuration, passed explicitly because the current adapter CLI otherwise defaults to a TypeScript config filename.
- `wrangler.jsonc`: Worker name, compatibility date, D1 binding, R2 bucket binding, KV rate-limit binding, and asset/build settings.
- `migrations/*.sql`: ordered D1 schema migrations and indexes.
- `.env.example` and `.dev.vars.example`: placeholders for auth secret, app URL, email provider key, and local configuration only.
- `public/_headers`: immutable caching for Next static assets.
- `.gitignore`: `.open-next`, Wrangler state, local vars, and generated output.
- `README.md`: local setup, D1 migration, R2 bucket creation, KV namespace creation, Better Auth setup, first-admin provisioning, email setup, Worker preview, and deployment.

All secrets remain in Wrangler secrets or local ignored files. No real credentials are committed.

## Verification strategy

- JavaScript lint and production build.
- Pure domain tests for date intervals, price resolution, report-period derivation, and status transition rules using Node’s built-in test runner.
- D1-local integration tests for schema constraints, approval atomicity, room/entire-property conflicts, duplicate completion prevention, cancellation state transitions, and report counts.
- Route-level authorization tests for guest, owner, wrong-owner, admin, unpublished listing, and revoked/expired guest-link access.
- R2 upload tests for size/type/path validation and public/private access behavior.
- Worker-runtime preview of OpenNext, followed by browser verification of public search/reservation, owner approval/completion, and admin reporting/CSV flows.
- Final audit of staged files to ensure no commission/payment code or credentials were added.

Known verification limits will be reported explicitly if Cloudflare credentials, a real email provider, or a production R2/D1 environment are unavailable.

## Resolved product defaults

These defaults are part of the approved v1 scope:

- One reservation covers exactly one rentable unit. Multi-room reservations are out of scope; guests submit separate requests for separate rooms.
- Pricing is resolved and locked when the owner approves. A pending request may show an estimate, but approval is blocked if any requested night has no valid rate. Store currency as PHP and monetary values as integer centavos; no fees or commissions are calculated.
- Admins manage businesses/listings and monitor reservations but do not change reservation statuses in the normal workflow. Owners perform reservation approval, decline, cancellation decisions, check-in, completion, and no-show actions.
- Better Auth email verification is the owner identity check. Businesses do not have a separate approval state; properties require admin approval before publication. Editing a published property returns it to draft/review when the edit affects public listing content, availability, or pricing.
- Guest emails are sent for request receipt, approval/decline, cancellation request outcome, and private-link delivery. Owners receive emails for new requests and cancellation requests. Check-in, completion, and no-show remain dashboard notifications unless delivery is explicitly configured later.
- Owners may check in on or after the check-in date, mark no-show on or after the check-in date when the guest has not arrived, and mark completed only after the checkout date. Cancellation requests remain available until checkout and never change availability until approved.
- Guest access links are reusable until revoked and expire 30 days after the reservation checkout date. A guest who loses the link can request a new link using the reservation reference and matching email address, subject to rate limits.
- The implementation includes source configuration, migrations, setup instructions, and local Worker preview. It does not provision or deploy to a real Cloudflare account without the user’s credentials and explicit deployment request.
- Guest reservation contact data is retained for 24 months after checkout or final cancellation, expired token hashes are purged after 30 days, and audit logs are retained for 7 years. These values are documented as operational defaults and can be changed before production launch if a legal/privacy policy requires it.
- Supported v1 listing coverage is transient house, apartment, and room property types, with a rental mode of individual room or entire property. Required fields are title, location text, capacity, description, rules, cancellation policy, and at least one image before submission. Each property/unit supports up to 15 images, each up to 10 MB, limited to JPEG, PNG, and WebP; admin approval is the moderation step.

The following implementation calls remain builder-owned: single owner-to-business relationship in v1, Resend as the first email provider adapter, server-proxied R2 image reads, D1 `batch()` for atomic owner approval, and checkout-date report grouping in the Asia/Manila timezone.
