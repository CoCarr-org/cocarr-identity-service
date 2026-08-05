const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const db = require('../configs/db');

// A platform session on top of Firebase auth. Firebase manages the short-lived
// ID token; this session tracks a longer-lived, device-bound refresh token the
// platform controls (only its hash is stored). Rotated on every refresh.
const Session = db.define('session', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
  identityId: { type: DataTypes.STRING, allowNull: false },
  deviceId: { type: DataTypes.STRING, allowNull: true },
  refreshTokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
  userAgent: { type: DataTypes.STRING, allowNull: true },
  ip: { type: DataTypes.STRING, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
}, { indexes: [{ fields: ['identityId'] }, { fields: ['refreshTokenHash'] }] });

module.exports = Session;
