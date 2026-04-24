# Teams database and API contract

This document specifies the Teams feature data model and endpoint contracts for invite and membership lifecycle.

## MCP-validated baseline

Validated through Skaftin MCP:

- Existing tables include `companies`, `user_businesses`, and `user_companies`.
- Existing pivot tables do not currently carry role/status metadata for memberships.
- Existing roles MCP listing currently errors (`column ur.user_id does not exist`), so role introspection must temporarily use SQL-based checks.

## Proposed schema

### `team_invites`

Purpose: durable invite tokens, status tracking, and resend/revoke lifecycle.

Columns:

- `id serial primary key`
- `business_id int not null` (FK to `companies.id`)
- `email_normalized varchar(320) not null`
- `role_key varchar(64) not null`
- `status varchar(32) not null default 'pending'` (`pending`, `sent`, `accepted`, `revoked`, `expired`)
- `token_hash varchar(255) not null`
- `token_version int not null default 1`
- `expires_at timestamp not null`
- `invited_by_user_id int not null`
- `accepted_by_user_id int null`
- `accepted_at timestamp null`
- `revoked_at timestamp null`
- `created_at timestamp not null default now()`
- `updated_at timestamp not null default now()`

Constraints:

- unique active invite per business/email:
  - partial unique index on (`business_id`, `email_normalized`) where `status in ('pending','sent')`
- unique `token_hash`
- check `expires_at > created_at`

Indexes:

- (`business_id`, `status`)
- (`email_normalized`)
- (`expires_at`)

### `team_memberships`

Purpose: org/business role assignment and active membership state.

Columns:

- `id serial primary key`
- `user_id int not null`
- `business_id int not null` (FK to `companies.id`)
- `role_key varchar(64) not null`
- `status varchar(32) not null default 'active'` (`active`, `inactive`, `removed`)
- `invited_via_invite_id int null` (FK to `team_invites.id`)
- `created_by_user_id int null`
- `created_at timestamp not null default now()`
- `updated_at timestamp not null default now()`

Constraints:

- unique active membership per user/business:
  - partial unique index on (`user_id`, `business_id`) where `status = 'active'`

Indexes:

- (`business_id`, `status`)
- (`user_id`, `status`)

### `membership_events` (audit)

Purpose: immutable event log for compliance and troubleshooting.

Columns:

- `id bigserial primary key`
- `membership_id int null`
- `invite_id int null`
- `business_id int not null`
- `actor_user_id int null`
- `target_user_id int null`
- `event_type varchar(64) not null`
- `event_payload jsonb not null default '{}'::jsonb`
- `created_at timestamp not null default now()`

Event types:

- `invite_created`
- `invite_resent`
- `invite_revoked`
- `invite_accepted`
- `membership_role_changed`
- `membership_removed`
- `membership_reactivated`

## SQL migration script

See [teams-feature.sql](sql/teams-feature.sql).

## API contract

### `POST /app-api/teams/invites`

Create invite or return existing active invite (idempotent on `business_id + email_normalized`).

Request:

```json
{
  "business_id": 3,
  "email": "member@example.com",
  "role_key": "member"
}
```

Response `200/201`:

```json
{
  "id": 42,
  "business_id": 3,
  "email_normalized": "member@example.com",
  "role_key": "member",
  "status": "sent",
  "expires_at": "2026-04-27T09:00:00.000Z"
}
```

### `POST /app-api/teams/invites/:inviteId/resend`

Regenerate link token (increment `token_version`) and resend email template.

### `POST /app-api/teams/invites/:inviteId/revoke`

Set invite status to `revoked`; invalidate all token versions.

### `GET /app-api/teams/invites/:token/preview`

Validate token signature/hash/expiry and return preview-safe details.

Response:

```json
{
  "valid": true,
  "token": "redacted",
  "business_id": 3,
  "business_name": "Bobo Software",
  "role_key": "member",
  "email": "member@example.com",
  "expires_at": "2026-04-27T09:00:00.000Z",
  "status": "sent"
}
```

### `POST /app-api/teams/invites/:token/accept`

Requires authenticated user; server must enforce email match to invite email.

Response:

```json
{
  "success": true,
  "active_business_id": 3,
  "membership": {
    "id": 77,
    "user_id": 12,
    "business_id": 3,
    "role_key": "member",
    "status": "active"
  }
}
```

### `GET /app-api/teams/members?business_id=:id`

List members for current business.

### `PATCH /app-api/teams/members/:membershipId/role`

Body:

```json
{
  "role_key": "admin"
}
```

### `DELETE /app-api/teams/members/:membershipId`

Soft remove membership (`status='removed'`) unless hard delete explicitly requested.

### `GET /app-api/auth/me/memberships`

Returns all memberships used by frontend context switcher.

## Acceptance rules

- Invite acceptance must fail with `409` when authenticated email does not match invite email.
- Expired/revoked/used tokens return `410` and include machine-readable reason.
- Role assignment cannot exceed inviter privileges.
- Last owner removal must be blocked with `422`.
