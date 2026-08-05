const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const db = require('../configs/db');

// IDENTITY MAPPING: the platform's own identity id (uuid) mapped to the Firebase
// UID (stored separately). This is the seam that lets the rest of the platform
// reference a stable identity without depending on Firebase's UID directly.
// NO roles or permissions live here — that is the Authorization service's job.
const Identity = db.define('identity', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
  firebaseUid: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: true, unique: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  displayName: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
}, { indexes: [{ fields: ['firebaseUid'] }, { fields: ['email'] }] });

module.exports = Identity;
