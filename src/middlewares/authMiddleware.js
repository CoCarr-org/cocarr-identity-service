const { CustomError } = require('./error');
const fb = require('../helper/firebaseAdmin');

// Verify the caller's Firebase ID token and attach req.actor. DEV: when Firebase
// is unconfigured OR AUTH_DISABLED=true, a synthetic actor is attached so the
// service is usable locally. Never set AUTH_DISABLED=true in production.
async function authenticate(req, res, next) {
  try {
    if (process.env.AUTH_DISABLED === 'true' || !fb.isConfigured()) {
      req.actor = { uid: 'dev', email: 'dev@local' };
      return next();
    }
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) throw new CustomError('Missing Authorization header', 401, 'UNAUTHENTICATED');
    const decoded = await fb.verifyIdToken(token);
    req.actor = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (err) {
    return next(err instanceof CustomError ? err : new CustomError('Invalid token', 401, 'UNAUTHENTICATED'));
  }
}
module.exports = { authenticate };
