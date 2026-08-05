const identityService = require('../services/identityService');
const deviceService = require('../services/deviceService');

async function myIdentity(req) { return identityService.me(req.actor.uid); }

module.exports = {
  list: async (req, res, next) => {
    try { const id = await myIdentity(req); res.json(await deviceService.list(id.id)); } catch (e) { next(e); }
  },
  register: async (req, res, next) => {
    try {
      const id = await myIdentity(req);
      const { deviceKey, platform, pushToken } = req.body;
      res.status(201).json(await deviceService.registerOrTouch(id.id, {
        deviceKey, platform, pushToken, userAgent: req.headers['user-agent'],
      }));
    } catch (e) { next(e); }
  },
  updatePushToken: async (req, res, next) => {
    try { const id = await myIdentity(req); res.json(await deviceService.updatePushToken(id.id, req.params.deviceId, req.body.pushToken)); }
    catch (e) { next(e); }
  },
  revoke: async (req, res, next) => {
    try { const id = await myIdentity(req); res.json(await deviceService.revoke(id.id, req.params.deviceId)); }
    catch (e) { next(e); }
  },
};
