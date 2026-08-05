const { CustomError } = require('../middlewares/error');
const { Identity } = require('../models');
const fb = require('../helper/firebaseAdmin');
const deviceService = require('./deviceService');
const sessionService = require('./sessionService');

// Upsert the identity mapping for a Firebase UID.
async function upsertFromFirebase(decoded) {
  const [identity] = await Identity.findOrCreate({
    where: { firebaseUid: decoded.uid },
    defaults: { email: decoded.email || null, displayName: decoded.name || null, phone: decoded.phone_number || null },
  });
  await identity.update({
    email: decoded.email || identity.email,
    displayName: decoded.name || identity.displayName,
    phone: decoded.phone_number || identity.phone,
    lastLoginAt: new Date(),
  });
  return identity;
}

// THE authentication entrypoint: a client that has signed in with Firebase posts
// its ID token here. We verify it, map it to a platform identity, register the
// device, and open a platform session (returning a refresh token once).
async function verify({ idToken, deviceKey, platform, pushToken, userAgent, ip }) {
  if (!fb.isConfigured()) throw new CustomError('Firebase is not configured on this service', 503, 'FIREBASE_UNCONFIGURED');
  if (!idToken) throw new CustomError('idToken is required', 400, 'VALIDATION_ERROR');
  let decoded;
  try { decoded = await fb.verifyIdToken(idToken); }
  catch (e) { throw new CustomError(`Invalid Firebase token: ${e.message}`, 401, 'UNAUTHENTICATED'); }

  const identity = await upsertFromFirebase(decoded);
  if (identity.status === 'disabled') throw new CustomError('This identity is disabled', 403, 'FORBIDDEN');

  const device = await deviceService.registerOrTouch(identity.id, { deviceKey, platform, pushToken, userAgent });
  const { session, refreshToken } = await sessionService.create({
    identityId: identity.id, deviceId: device ? device.id : null, userAgent, ip,
  });

  return {
    identity,
    device,
    session: { id: session.id, expiresAt: session.expiresAt },
    refreshToken, // returned ONCE
  };
}

async function getByFirebaseUid(firebaseUid) {
  const identity = await Identity.findOne({ where: { firebaseUid } });
  if (!identity) throw new CustomError('Identity not found', 404, 'NOT_FOUND');
  return identity;
}

async function me(uid) {
  return getByFirebaseUid(uid);
}

module.exports = { verify, upsertFromFirebase, getByFirebaseUid, me };
