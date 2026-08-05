const identityService = require('../services/identityService');
const sessionService = require('../services/sessionService');

module.exports = {
  me: async (req, res, next) => {
    try { res.json(await identityService.me(req.actor.uid)); } catch (e) { next(e); }
  },
  getByUid: async (req, res, next) => {
    try { res.json(await identityService.getByFirebaseUid(req.params.firebaseUid)); } catch (e) { next(e); }
  },
  sessions: async (req, res, next) => {
    try {
      const identity = await identityService.me(req.actor.uid);
      res.json(await sessionService.listActive(identity.id));
    } catch (e) { next(e); }
  },
};
