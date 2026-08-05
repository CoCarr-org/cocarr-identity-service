const admin = require('firebase-admin');
const Logger = require('./logger');

// Firebase Admin for authentication. Lazy + optional so the service boots in dev
// without credentials; when unconfigured, token verification and password-link
// generation are disabled and the relevant endpoints answer 503.
let app = null;
let configured = false;

function parseServiceAccount() {
  const raw = process.env.ADMIN_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    if (raw.trim().startsWith('{')) return JSON.parse(raw);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(require('path').resolve(raw));
  } catch (e) {
    Logger.error(`ADMIN_SERVICE_ACCOUNT could not be parsed: ${e.message}`);
    return null;
  }
}

function init() {
  if (app) return app;
  const sa = parseServiceAccount();
  if (!sa) { Logger.warn('[firebase] ADMIN_SERVICE_ACCOUNT not set — auth verification disabled.'); return null; }
  app = admin.initializeApp({ credential: admin.credential.cert(sa) }, 'identity');
  configured = true;
  Logger.info('[firebase] Admin app initialised for identity.');
  return app;
}
init();

const isConfigured = () => configured;
const verifyIdToken = (token) => admin.auth(app).verifyIdToken(token);
const generatePasswordResetLink = (email) => admin.auth(app).generatePasswordResetLink(email);
const getUserByEmail = (email) => admin.auth(app).getUserByEmail(email);

module.exports = { isConfigured, verifyIdToken, generatePasswordResetLink, getUserByEmail };
