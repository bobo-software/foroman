-- Teams feature schema
-- Apply in transactional migration runner where available.

BEGIN;

CREATE TABLE IF NOT EXISTS team_invites (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_normalized VARCHAR(320) NOT NULL,
  role_key VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  token_hash VARCHAR(255) NOT NULL,
  token_version INT NOT NULL DEFAULT 1,
  expires_at TIMESTAMP NOT NULL,
  invited_by_user_id INT NOT NULL,
  accepted_by_user_id INT,
  accepted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT team_invites_status_chk CHECK (status IN ('pending', 'sent', 'accepted', 'revoked', 'expired')),
  CONSTRAINT team_invites_expiry_chk CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_team_invites_token_hash
  ON team_invites(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS ux_team_invites_active_email_per_business
  ON team_invites(business_id, email_normalized)
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS ix_team_invites_business_status
  ON team_invites(business_id, status);

CREATE INDEX IF NOT EXISTS ix_team_invites_expires_at
  ON team_invites(expires_at);

CREATE TABLE IF NOT EXISTS team_memberships (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  business_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_key VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  invited_via_invite_id INT REFERENCES team_invites(id) ON DELETE SET NULL,
  created_by_user_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT team_memberships_status_chk CHECK (status IN ('active', 'inactive', 'removed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_team_memberships_active_user_business
  ON team_memberships(user_id, business_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS ix_team_memberships_business_status
  ON team_memberships(business_id, status);

CREATE TABLE IF NOT EXISTS membership_events (
  id BIGSERIAL PRIMARY KEY,
  membership_id INT REFERENCES team_memberships(id) ON DELETE SET NULL,
  invite_id INT REFERENCES team_invites(id) ON DELETE SET NULL,
  business_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id INT,
  target_user_id INT,
  event_type VARCHAR(64) NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_membership_events_business_created
  ON membership_events(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_membership_events_event_type
  ON membership_events(event_type);

COMMIT;
