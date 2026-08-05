const express = require('express');
const { check } = require('express-validator');
const { assertValid } = require('../utils/validate');
const { authenticate } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/authController');

const router = express.Router();
const validate = (req, res, next) => { try { assertValid(req); next(); } catch (e) { next(e); } };

// Public authentication entrypoints.
router.post('/verify', [check('idToken').notEmpty().withMessage('idToken is required'), validate], ctrl.verify);
router.post('/session/refresh', [check('refreshToken').notEmpty().withMessage('refreshToken is required'), validate], ctrl.refresh);
router.post('/session/revoke', ctrl.revoke);

// Password links are privileged (generate via Firebase Admin) — require auth.
router.post('/password/setup', [authenticate, check('email').isEmail().withMessage('a valid email is required'), validate], ctrl.setupPassword);
router.post('/password/reset', [authenticate, check('email').isEmail().withMessage('a valid email is required'), validate], ctrl.resetPassword);

module.exports = router;
