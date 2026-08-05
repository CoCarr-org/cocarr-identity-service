const { CustomError } = require('../middlewares/error');
const fb = require('../helper/firebaseAdmin');

// Password SETUP (new user) and RESET both generate a Firebase password link.
// The link is returned to the caller (an authenticated admin flow) to hand to
// the user — this service does not send email itself; the Notification service
// would deliver it. Requires Firebase to be configured.
async function link(email, kind) {
  if (!fb.isConfigured()) throw new CustomError('Firebase is not configured on this service', 503, 'FIREBASE_UNCONFIGURED');
  if (!email) throw new CustomError('email is required', 400, 'VALIDATION_ERROR');
  try {
    const resetLink = await fb.generatePasswordResetLink(email);
    return { email, kind, resetLink };
  } catch (e) {
    throw new CustomError(`Could not generate ${kind} link: ${e.message}`, 502, 'FIREBASE_ERROR');
  }
}

module.exports = {
  setupLink: (email) => link(email, 'setup'),
  resetLink: (email) => link(email, 'reset'),
};
