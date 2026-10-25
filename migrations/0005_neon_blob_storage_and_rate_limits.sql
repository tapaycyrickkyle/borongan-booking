ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_data BYTEA;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_content_type TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE unit_images ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE unit_images ADD COLUMN IF NOT EXISTS content_type TEXT;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  bucket BIGINT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (scope, identifier, bucket)
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_expiry_idx ON rate_limit_buckets (expires_at);
