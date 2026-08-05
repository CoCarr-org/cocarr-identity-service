const crypto = require('crypto');

// Opaque refresh tokens: a random secret is returned to the client ONCE; only
// its SHA-256 hash is stored, so a database leak does not expose usable tokens.
const newRefreshToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

module.exports = { newRefreshToken, hashToken };
