const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/identityController');

const router = express.Router();
router.get('/me', authenticate, ctrl.me);
router.get('/sessions', authenticate, ctrl.sessions);
router.get('/:firebaseUid', authenticate, ctrl.getByUid); // internal mapping lookup

module.exports = router;
