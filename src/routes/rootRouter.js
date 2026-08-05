const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('../docs/openapi');
const { health } = require('../controllers/healthController');

const router = express.Router();
router.get('/health', health);
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

router.use('/auth', require('./authRouter'));
router.use('/devices', require('./deviceRouter'));
router.use('/identity', require('./identityRouter'));

module.exports = router;
