const { Device } = require('../models');

// Upsert a device for an identity by (identityId, deviceKey).
async function registerOrTouch(identityId, { deviceKey, platform, pushToken, userAgent } = {}) {
  if (!deviceKey) return null;
  const [device] = await Device.findOrCreate({
    where: { identityId, deviceKey },
    defaults: { platform, pushToken },
  });
  await device.update({
    platform: platform || device.platform,
    pushToken: pushToken || device.pushToken,
    lastSeenAt: new Date(),
    revokedAt: null,
    ...(userAgent ? {} : {}),
  });
  return device;
}

async function list(identityId) {
  return Device.findAll({ where: { identityId }, order: [['lastSeenAt', 'DESC']] });
}

async function revoke(identityId, deviceId) {
  const device = await Device.findOne({ where: { id: deviceId, identityId } });
  if (!device) return null;
  await device.update({ revokedAt: new Date() });
  return device;
}

async function updatePushToken(identityId, deviceId, pushToken) {
  const device = await Device.findOne({ where: { id: deviceId, identityId } });
  if (!device) return null;
  await device.update({ pushToken });
  return device;
}

module.exports = { registerOrTouch, list, revoke, updatePushToken };
