BEGIN;

-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" ("userId");
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account ("userId");
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES "user" (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  suspension_reason TEXT,
  logo_object_key TEXT,
  logo_data BYTEA,
  logo_content_type TEXT,
  logo_alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('transient_house', 'apartment', 'room')),
  rental_mode TEXT NOT NULL CHECK (rental_mode IN ('room', 'entire_property')),
  location_text TEXT NOT NULL,
  description TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 50),
  house_rules TEXT NOT NULL,
  cancellation_policy TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended')),
  rejection_reason TEXT,
  approved_by TEXT REFERENCES "user" (id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rental_mode TEXT NOT NULL CHECK (rental_mode IN ('room', 'entire_property')),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 50),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amenities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_amenities (
  property_id TEXT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS unit_amenities (
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
  PRIMARY KEY (unit_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  image_data BYTEA,
  content_type TEXT,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS unit_images (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  image_data BYTEA,
  content_type TEXT,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nightly_rates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE IF NOT EXISTS special_rates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 1 AND 50),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  estimated_total_centavos INTEGER CHECK (estimated_total_centavos IS NULL OR estimated_total_centavos >= 0),
  agreed_total_centavos INTEGER CHECK (agreed_total_centavos IS NULL OR agreed_total_centavos >= 0),
  currency TEXT NOT NULL DEFAULT 'PHP' CHECK (currency = 'PHP'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancellation_requested', 'cancelled', 'checked_in', 'completed', 'no_show')),
  cancellation_policy_snapshot TEXT NOT NULL,
  owner_decision_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  no_show_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (check_out > check_in)
);

CREATE TABLE IF NOT EXISTS reservation_rate_snapshots (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  stay_date DATE NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  UNIQUE (reservation_id, stay_date)
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE IF NOT EXISTS reservation_status_history (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id TEXT REFERENCES "user" (id) ON DELETE SET NULL,
  reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guest_access_tokens (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'reservation' CHECK (purpose IN ('reservation', 'reissue')),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations (id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  email_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'queued', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES "user" (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS properties_business_idx ON properties (business_id, publication_status);
CREATE INDEX IF NOT EXISTS properties_public_idx ON properties (publication_status, archived_at);
CREATE INDEX IF NOT EXISTS units_property_idx ON units (property_id, is_active, rental_mode);
CREATE INDEX IF NOT EXISTS property_images_property_idx ON property_images (property_id, moderation_status, sort_order);
CREATE INDEX IF NOT EXISTS unit_images_unit_idx ON unit_images (unit_id, moderation_status, sort_order);
CREATE INDEX IF NOT EXISTS nightly_rates_lookup_idx ON nightly_rates (unit_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS special_rates_lookup_idx ON special_rates (unit_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS blocked_dates_lookup_idx ON blocked_dates (unit_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS reservations_unit_dates_idx ON reservations (unit_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS reservations_property_dates_idx ON reservations (property_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations (status, check_out);
CREATE INDEX IF NOT EXISTS reservation_history_lookup_idx ON reservation_status_history (reservation_id, created_at);
CREATE INDEX IF NOT EXISTS guest_tokens_reservation_idx ON guest_access_tokens (reservation_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_user_id, created_at);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  bucket BIGINT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (scope, identifier, bucket)
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_expiry_idx ON rate_limit_buckets (expires_at);

COMMIT;
