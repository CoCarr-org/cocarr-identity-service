# cocarr-identity-service

Express + Sequelize (MySQL) + Firebase service. **Authentication only** — no
roles, no permissions (that is cocarr-authorization-service). Mirrors the other
services' conventions. **Working branch: `develop`.** Port **3050**.

## The rules
- **Identity mapping is the seam.** `identity.id` (uuid) is the platform identity;
  `identity.firebaseUid` is stored separately. The rest of the platform should
  reference the platform id, not the Firebase UID — this service is where they
  are mapped (`upsertFromFirebase`).
- **Refresh tokens are opaque + hashed.** `/auth/verify` and `/auth/session/refresh`
  return a random token ONCE; only its SHA-256 hash is stored. Refresh **rotates**
  the token (single-use): a replayed token fails after the legit rotation. TTL is
  `SESSION_TTL_DAYS` (default 30).
- **Firebase manages the ID token; this service manages the platform session.**
  `/auth/verify` takes a Firebase ID token, verifies it, upserts the identity,
  registers the device, and opens a session.
- **Firebase optional in dev.** Unconfigured or `AUTH_DISABLED=true` → auth-guarded
  routes get a synthetic actor; `/auth/verify` and password links return 503
  (they genuinely need Firebase). Never disable auth in production.
- **No roles/permissions here.** Do not add them — authorization is a separate
  service. This service answers "who is this", not "what may they do".

## Endpoints
- Public: `POST /v1/auth/verify`, `/auth/session/refresh`, `/auth/session/revoke`
- JWT: `/auth/password/{setup,reset}`, `/identity/me`, `/identity/sessions`,
  `/identity/:firebaseUid`, `/devices` (CRUD)

## Boundaries / not done yet
- Uses the **admin** Firebase project (`ADMIN_SERVICE_ACCOUNT`). Rider/user
  project support (two projects, as in core-api) is a later addition.
- Forgot-password is currently JWT-guarded (avoids an open reset-link/enumeration
  endpoint). A public, rate-limited forgot-password flow can be added later.
- The gateway verifies JWTs itself today; delegating verification to this
  service is a future step.
- No email sending — password links are returned to the caller; the Notification
  service will deliver them.
- Tests.

## Verified
Syntax-clean; full require graph loads; live HTTP smoke test (health/docs,
verify→503 unconfigured, validation 400s, auth routing, 404) with the DB
intentionally unreachable. Full session/refresh/device flow needs a MySQL
instance (see cocarr-devops compose).
