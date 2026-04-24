# Teams rollout and validation

## Phased rollout

### Phase 1: data and API

- apply `team_invites`, `team_memberships`, and `membership_events` schema
- release invite create/preview/accept/revoke/resend APIs
- release team member list/update/remove APIs
- enable invite email template rendering

### Phase 2: acceptance path

- deploy `/invite/:token` and `/invite/:token/accept`
- verify login/register `returnTo` continuity
- verify email mismatch handling

### Phase 3: operations UI

- deploy `/app/settings/team` invite/member management
- expose multi-business switcher in navbar
- include membership hydration in session startup

### Phase 4: hardening

- add invite abuse rate limits
- add alerting for invite/send failures
- add full audit dashboards from `membership_events`

## MCP validation checklist

Pre-release checks:

- confirm table schemas via MCP `get_table_schema`
- confirm indexes and constraints through SQL metadata query
- test invite insert/select paths via MCP `insert_data`/`select_data`
- verify role assignment queries with fallback SQL until MCP role tool fix lands

## Production readiness checklist

- secrets and mail provider configured for invite template send
- invite URL base domain set to production frontend
- token expiry and revocation behavior tested
- last-owner removal guard tested
- rollback scripts validated

## Test matrix summary

- Existing user accepts invite while logged in
- Existing user accepts invite after login
- New user accepts invite after register
- Email mismatch rejection
- Expired token path
- Revoked token path
- Replay token rejection
- Role downgrade/upgrade by owner/admin
- Multi-business switch and persisted active context
