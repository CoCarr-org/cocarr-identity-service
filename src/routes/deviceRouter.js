const express = require('express');
const { check } = require('express-validator');
const { assertValid } = require('../utils/validate');
const { authenticate } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/deviceController');

const router = express.Router();
const validate = (req, res, next) => { try { assertValid(req); next(); } catch (e) { next(e); } };

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', [check('deviceKey').notEmpty().withMessage('deviceKey is required'), validate], ctrl.register);
router.put('/:deviceId/push-token', ctrl.updatePushToken);
router.delete('/:deviceId', ctrl.revoke);

module.exports = router;
