// Register models + associations before db.sync (same discipline as the other
// services).
const db = require('../configs/db');
const Identity = require('./identity');
const Device = require('./device');
const Session = require('./session');

Identity.hasMany(Device, { foreignKey: 'identityId' });
Device.belongsTo(Identity, { foreignKey: 'identityId' });

Identity.hasMany(Session, { foreignKey: 'identityId' });
Session.belongsTo(Identity, { foreignKey: 'identityId' });
Session.belongsTo(Device, { foreignKey: 'deviceId' });

module.exports = { db, Identity, Device, Session };
