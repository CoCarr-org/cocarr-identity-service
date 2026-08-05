const identityService = require('../services/identityService');
const sessionService = require('../services/sessionService');
const passwordService = require('../services/passwordService');

const ipOf = (req) => (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();

module.exports = {
  verify: async (req, res, next) => {
    try {
      const { idToken, deviceKey, platform, pushToken } = req.body;
      const result = await identityService.verify({
        idToken, deviceKey, platform, pushToken,
        userAgent: req.headers['user-agent'], ip: ipOf(req),
      });
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
  refresh: async (req, res, next) => {
    try {
      const { session, refreshToken } = await sessionService.refresh(req.body.refreshToken);
      res.json({ session: { id: session.id, expiresAt: session.expiresAt }, refreshToken });
    } catch (e) { next(e); }
  },
  revoke: async (req, res, next) => {
    try { res.json(await sessionService.revoke({ sessionId: req.body.sessionId, refreshToken: req.body.refreshToken })); }
    catch (e) { next(e); }
  },
  setupPassword: async (req, res, next) => {
    try { res.json(await passwordService.setupLink(req.body.email)); } catch (e) { next(e); }
  },
  resetPassword: async (req, res, next) => {
    try { res.json(await passwordService.resetLink(req.body.email)); } catch (e) { next(e); }
  },
};
