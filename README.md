# cocarr-identity-service

> Enterprise Identity Service for Authentication, Sessions, Devices and User Identity.

Part of the **Cocarr Enterprise Platform** ([CoCarr-org](https://github.com/CoCarr-org)).

Topics: `identity`, `firebase`, `authentication`, `jwt`

## Purpose
**Authentication only.** Owns identity mapping (Firebase UID ↔ platform identity
id), platform sessions, refresh tokens, password setup/reset links, and device
management. It holds **no roles and no permissions** — that is the Authorization
Service's job. Same stack as the other Cocarr services (Express + Sequelize +
MySQL + Firebase Admin).

## Architecture
Sits behind the API Gateway (`/v1/auth/*` → this service). A client signs in with
Firebase, then exchanges its Firebase ID token here for a platform **session**
and an opaque **refresh token** (only the token's SHA-256 hash is stored). The
platform identity id is the stable seam the rest of the platform references
instead of the Firebase UID directly.

```
Client (Firebase sign-in) → /v1/auth/verify → Identity { session, refreshToken }
                          → /v1/auth/session/refresh (rotate)
```

## Technology Stack
- Node.js + Express
- Sequelize ORM (MySQL)
- Firebase Admin (ID-token verification, password links)
- express-validator, winston, swagger-ui-express
- crypto (opaque refresh tokens, hash-at-rest)

## Folder Structure
```
index.js                 # Entry; registers models, syncs schema, mounts /v1
src/models/              # identity, device, session (+ index.js associations)
src/services/            # identity, session, device, password
src/controllers/         # auth, identity, device, health
src/routes/              # authRouter, identityRouter, deviceRouter, rootRouter
src/middlewares/         # error, authMiddleware (Firebase verify + dev hatch)
src/helper/              # logger, firebaseAdmin (lazy/optional)
src/utils/               # tokens (opaque refresh), validate
src/docs/openapi.js      # OpenAPI 3 spec served at /v1/docs
```

## Endpoints
| Method | Path | Auth | What |
|---|---|---|---|
| GET | `/v1/health` | – | liveness + DB + firebase status |
| GET | `/v1/docs` | – | Swagger UI |
| POST | `/v1/auth/verify` | public | verify Firebase token → identity + session + refresh token |
| POST | `/v1/auth/session/refresh` | public | rotate refresh token |
| POST | `/v1/auth/session/revoke` | public | logout |
| POST | `/v1/auth/password/setup` · `/reset` | JWT | generate Firebase password link |
| GET | `/v1/identity/me` · `/sessions` | JWT | caller's identity / active sessions |
| GET | `/v1/identity/:firebaseUid` | JWT | mapping lookup (internal) |
| CRUD | `/v1/devices` | JWT | register / list / revoke, push-token update |

See [`CLAUDE.md`](CLAUDE.md) for the identity-mapping rule, refresh-token rotation
and the Firebase-optional dev mode.

## Getting Started
```bash
git clone https://github.com/CoCarr-org/cocarr-identity-service.git
cd cocarr-identity-service && git checkout develop
cp .env.example .env      # set DB_* and ADMIN_SERVICE_ACCOUNT
npm install && npm run dev # http://localhost:3050/v1/health , docs at /v1/docs
```

## Branch Strategy
`main` (protected) · `develop` (working) · `release`. Feature branches from `develop`.

## Deployment
Containerised (`Dockerfile`) + Railway (`railway.json`, healthcheck `/v1/health`)
from `develop`. Talks to `cocarr-iam-db`. Reached via `cocarr-api-gateway`
(`/v1/auth`).

## License
[MIT](LICENSE).
