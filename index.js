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
db.sync({ alter: true })
  .then(() => Logger.info('Identity schema synced.'))
  .catch((err) => Logger.error(`Schema sync failed: ${err.message}`))
// Bind with NO host argument, so Node listens on :: with dual-stack and accepts
// both IPv4 and IPv6. Railway's PRIVATE NETWORK IS IPv6-ONLY: a server bound to
// '0.0.0.0' is reachable from the public edge and completely unreachable from
// sibling services, which presents as the gateway 502-ing every upstream while
// each upstream looks perfectly healthy on its own.
  .finally(() => app.listen(PORT, () => Logger.info(`cocarr-identity-service listening on ${PORT}`)));
