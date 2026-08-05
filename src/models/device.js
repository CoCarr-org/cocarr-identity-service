const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const db = require('../configs/db');

// A device an identity signs in from. deviceKey is a stable client-generated id;
// pushToken is stored for the Notification service to consume later.
const Device = db.define('device', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
  identityId: { type: DataTypes.STRING, allowNull: false },
  deviceKey: { type: DataTypes.STRING, allowNull: false },
  platform: { type: DataTypes.STRING, allowNull: true }, // ios | android | web
  pushToken: { type: DataTypes.STRING, allowNull: true },
  trusted: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastSeenAt: { type: DataTypes.DATE, allowNull: true },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
}, { indexes: [{ fields: ['identityId'] }, { fields: ['deviceKey'] }] });

module.exports = Device;
