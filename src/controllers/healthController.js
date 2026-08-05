const db = require('../configs/db');
const { authMode } = require('../helper/authMode');
const fb = require('../helper/firebaseAdmin');
async function health(req, res) {
  let dbOk = false;
  try { await db.authenticate(); dbOk = true; } catch (_) { dbOk = false; }
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    service: 'cocarr-identity-service',
    db: dbOk,
    firebase: fb.isConfigured(),
    auth: authMode(),
    time: new Date().toISOString(),
  });
}
module.exports = { health };
