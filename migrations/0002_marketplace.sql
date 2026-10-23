PRAGMA foreign_keys = ON;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  suspension_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
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
  approved_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT
);

CREATE TABLE units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rental_mode TEXT NOT NULL CHECK (rental_mode IN ('room', 'entire_property')),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 50),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE amenities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE property_amenities (
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE unit_amenities (
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (unit_id, amenity_id)
);

CREATE TABLE property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'removed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TEXT
);

CREATE TABLE unit_images (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'removed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TEXT
);

CREATE TABLE nightly_rates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE special_rates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE blocked_dates (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_on > starts_on)
);

CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 1 AND 50),
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  estimated_total_centavos INTEGER CHECK (estimated_total_centavos IS NULL OR estimated_total_centavos >= 0),
  agreed_total_centavos INTEGER CHECK (agreed_total_centavos IS NULL OR agreed_total_centavos >= 0),
  currency TEXT NOT NULL DEFAULT 'PHP' CHECK (currency = 'PHP'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancellation_requested', 'cancelled', 'checked_in', 'completed', 'no_show')),
  cancellation_policy_snapshot TEXT NOT NULL,
  owner_decision_reason TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  checked_in_at TEXT,
  completed_at TEXT,
  no_show_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (check_out > check_in)
);

CREATE TABLE reservation_rate_snapshots (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  stay_date TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos >= 0),
  UNIQUE (reservation_id, stay_date)
);

CREATE TABLE reservation_status_history (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guest_access_tokens (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'reservation' CHECK (purpose IN ('reservation', 'reissue')),
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  recipient_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  email_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'queued', 'sent', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
