require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

fs.mkdirSync('logs', { recursive: true });

const Logger = require('./src/helper/logger');
const { db } = require('./src/models');
const { mountVersions } = require('./src/routes/apiVersions');
const { errorHandlerMiddleware } = require('./src/middlewares/error');

const app = express();

const CORS_ORIGINS = String(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
if (CORS_ORIGINS.length === 0) {
  console.warn('[cors] CORS_ORIGINS not set — allowing every origin. Set it in production.');
  app.use(cors({ origin: '*' }));
} else {
  app.use(cors({ origin: (o, cb) => (!o || CORS_ORIGINS.includes(o) ? cb(null, true) : cb(new Error('Not allowed by CORS'))), credentials: true }));
}

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
// Every supported API version is mounted from one registry, which also emits
// the Deprecation/Sunset headers and serves GET /versions. Adding v2 is an
// entry in src/routes/apiVersions.js — no change here.
mountVersions(app, { log: Logger });
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3050;
// Classify the connection BEFORE sync, so "the schema does not exist" is
// reported as that rather than as a confusing sync error, and so a service that
// cannot reach its database says so in one line instead of booting healthy and
// failing every query. Never throws.
const { preflight } = require('./src/configs/dbPreflight');

const { status: migrationStatus } = require('./src/db/migrator');

// THE SERVICE NO LONGER CHANGES THE SCHEMA. Migrations do, as a release step
// (`npm run migrate:up`), before the new revision takes traffic.
//
// `db.sync({ alter: true })` is gone from the boot path. It dropped any column
// no longer declared on a model, aborted its whole pass on one bad foreign key
// leaving later models with no tables, and accumulated indexes toward MySQL's
// 64-key limit — on every single boot, in every environment, irreversibly.
//
// Boot now only REPORTS drift. A revision whose migrations have not been
// applied is running new code against an old schema, which is worse than being
// down because it looks healthy; saying so loudly is how that gets caught.
// Development can still use sync for convenience, explicitly, via DB_SYNC=true.
preflight(db, Logger)
  .then(async ({ ok }) => {
    if (!ok) return; // already reported, in detail, by the preflight

    if (process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production') {
      Logger.error('DB_SYNC=true — using db.sync({alter:true}). Development only; never set this in production.');
      await db.sync({ alter: true });
      Logger.info('Identity schema synced (DB_SYNC).');
      return;
    }

    const { executed, pending } = await migrationStatus();
    if (pending.length) {
      Logger.error('!!! PENDING MIGRATIONS — THIS REVISION IS RUNNING AGAINST AN OLD SCHEMA !!!');
      Logger.error(`  pending (${pending.length}): ${pending.join(', ')}`);
      Logger.error('  Run `npm run migrate:up` as a release step BEFORE this revision takes traffic.');
      return;
    }
    Logger.info(`Schema up to date — ${executed.length} migration(s) applied.`);
  })
  .catch((err) => {
    // Never fatal at boot: /health reports the degraded state, which is more
    // diagnosable than a container that will not start.
    Logger.error(`Could not determine migration status: ${err?.parent?.sqlMessage || err.message}`);
  })
// Bind with NO host argument, so Node listens on :: with dual-stack and accepts
// both IPv4 and IPv6. Railway's PRIVATE NETWORK IS IPv6-ONLY: a server bound to
// '0.0.0.0' is reachable from the public edge and completely unreachable from
// sibling services, which presents as the gateway 502-ing every upstream while
// each upstream looks perfectly healthy on its own.
  .finally(() => app.listen(PORT, () => Logger.info(`cocarr-identity-service listening on ${PORT}`)));
