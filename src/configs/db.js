const { Sequelize } = require('sequelize');
const Logger = require('../helper/logger');

// Identity database (MySQL) — maps Firebase identities to platform identities
// and stores sessions/devices. Same shape as the other services' db config.
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
});

db.authenticate()
  .then(() => Logger.info('Identity DB connection established.'))
  .catch((err) => Logger.error(`Unable to connect to the identity DB: ${err}`));

module.exports = db;
