require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

fs.mkdirSync('logs', { recursive: true });

const Logger = require('./src/helper/logger');
const { db } = require('./src/models');
const rootRouter = require('./src/routes/rootRouter');
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
app.use('/v1', rootRouter);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3050;
// Classify the connection BEFORE sync, so "the schema does not exist" is
// reported as that rather than as a confusing sync error, and so a service that
// cannot reach its database says so in one line instead of booting healthy and
// failing every query. Never throws.
const { preflight } = require('./src/configs/dbPreflight');

preflight(db, Logger)
  .then(({ ok }) => {
    // Skip the sync when the database is unreachable: it can only produce a
    // noisier version of the error already reported, and burying the real
    // cause under it is how these go unnoticed.
    if (!ok) return Promise.reject(new Error('database unreachable'));
    return db.sync({ alter: true }).then(() => Logger.info('Identity schema synced.'));
  })
  .catch((err) => {
    if (err.message === 'database unreachable') return; // already reported above
    Logger.error('!!! SCHEMA SYNC FAILED — TABLES MAY BE MISSING !!!');
    Logger.error(`  reason: ${err?.parent?.sqlMessage || err.message}`);
    Logger.error('  alter:true aborts the whole pass, so every model after the');
    Logger.error('  failure point has no table. Check with scripts/ensureDatabase.js --dry-run');
  })
// Bind with NO host argument, so Node listens on :: with dual-stack and accepts
// both IPv4 and IPv6. Railway's PRIVATE NETWORK IS IPv6-ONLY: a server bound to
// '0.0.0.0' is reachable from the public edge and completely unreachable from
// sibling services, which presents as the gateway 502-ing every upstream while
// each upstream looks perfectly healthy on its own.
  .finally(() => app.listen(PORT, () => Logger.info(`cocarr-identity-service listening on ${PORT}`)));
