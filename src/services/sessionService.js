const { Op } = require('sequelize');
const { Session } = require('../models');
const { CustomError } = require('../middlewares/error');
const { newRefreshToken, hashToken } = require('../utils/tokens');

const TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '30', 10);
const expiry = () => new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

async function create({ identityId, deviceId, userAgent, ip }) {
  const token = newRefreshToken();
  const session = await Session.create({
    identityId, deviceId: deviceId || null, userAgent, ip,
    refreshTokenHash: hashToken(token), expiresAt: expiry(),
  });
  // Plaintext token returned ONCE — only its hash is stored.
  return { session, refreshToken: token };
}

async function findActiveByToken(refreshToken) {
  const session = await Session.findOne({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  return session;
}

// Rotate: the presented token is consumed and a new one issued. A refresh token
// is single-use, so a stolen-and-replayed token fails after the legit rotation.
async function refresh(refreshToken) {
  if (!refreshToken) throw new CustomError('refreshToken is required', 400, 'VALIDATION_ERROR');
  const session = await findActiveByToken(refreshToken);
  if (!session) throw new CustomError('Invalid or expired refresh token', 401, 'UNAUTHENTICATED');
  const token = newRefreshToken();
  await session.update({ refreshTokenHash: hashToken(token), expiresAt: expiry() });
  return { session, refreshToken: token };
}

async function revoke({ sessionId, refreshToken, identityId }) {
  let session = null;
  if (sessionId) session = await Session.findOne({ where: { id: sessionId, ...(identityId ? { identityId } : {}) } });
  else if (refreshToken) session = await Session.findOne({ where: { refreshTokenHash: hashToken(refreshToken) } });
  if (!session) throw new CustomError('Session not found', 404, 'NOT_FOUND');
  await session.update({ revokedAt: new Date() });
  return { success: true };
}

async function listActive(identityId) {
  return Session.findAll({
    where: { identityId, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
    attributes: ['id', 'deviceId', 'userAgent', 'ip', 'createdAt', 'expiresAt'],
    order: [['createdAt', 'DESC']],
  });
}

module.exports = { create, refresh, revoke, listActive, findActiveByToken };
