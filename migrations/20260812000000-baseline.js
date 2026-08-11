// BASELINE — the schema as it stood when migrations were adopted.
//
// Two databases must both end up correct after this runs, and they start in
// completely different states:
//
//   FRESH      no tables at all      -> create them
//   EXISTING   tables already made    -> create nothing, just record that this
//              by db.sync(alter)         migration is "already applied"
//
// The second case is the whole reason a baseline is delicate. Every deployed
// environment already has these tables, built by the alter-sync this replaces.
// Blindly running CREATE TABLE there fails; skipping the record instead leaves
// the database looking un-migrated forever, so every later deploy would retry
// the baseline and fail again.
//
// So: each table is created ONLY if absent. The migration is recorded as
// applied either way, which is exactly the claim we want to make — "the schema
// is at least at baseline" — and it makes this file idempotent and safe to run
// against dev, staging and production alike.
//
// Migrations use the QueryInterface and never a model. Models describe the
// CURRENT shape; this file must describe the shape at ITS point in history, or
// replaying it a year from now would build whatever the models happen to say
// then.

const TABLES = ['identities', 'sessions', 'devices'];

// `id` is a STRING uuid throughout this platform, not a native UUID column, and
// every foreign key that points at one must match — a CHAR(36)/VARCHAR mismatch
// is rejected by MySQL and is the single most common cause of an aborted sync
// in these repos.
const TIMESTAMPS = (Sequelize) => ({
  createdAt: { type: Sequelize.DATE, allowNull: false },
  updatedAt: { type: Sequelize.DATE, allowNull: false },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.showAllTables();
    const have = new Set(existing.map((t) => (typeof t === 'string' ? t : t.tableName)));

    // Nothing to do on an environment whose tables alter-sync already built.
    // Recording the migration is the point of the run there.
    const missing = TABLES.filter((t) => !have.has(t));
    if (!missing.length) return;

    if (!have.has('identities')) {
      await queryInterface.createTable('identities', {
        id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        firebaseUid: { type: Sequelize.STRING, allowNull: false, unique: true },
        email: { type: Sequelize.STRING, allowNull: true, unique: true },
        phone: { type: Sequelize.STRING, allowNull: true },
        displayName: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
        lastLoginAt: { type: Sequelize.DATE, allowNull: true },
        ...TIMESTAMPS(Sequelize),
      });
      // Named explicitly. Sequelize auto-names indexes differently per
      // environment, and an index you cannot name is one you cannot drop.
      await queryInterface.addIndex('identities', ['firebaseUid'], { name: 'identities_firebase_uid' });
      await queryInterface.addIndex('identities', ['email'], { name: 'identities_email' });
    }

    if (!have.has('sessions')) {
      await queryInterface.createTable('sessions', {
        id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        identityId: { type: Sequelize.STRING, allowNull: false },
        deviceId: { type: Sequelize.STRING, allowNull: true },
        refreshTokenHash: { type: Sequelize.STRING, allowNull: false, unique: true },
        userAgent: { type: Sequelize.STRING, allowNull: true },
        ip: { type: Sequelize.STRING, allowNull: true },
        expiresAt: { type: Sequelize.DATE, allowNull: false },
        revokedAt: { type: Sequelize.DATE, allowNull: true },
        ...TIMESTAMPS(Sequelize),
      });
      await queryInterface.addIndex('sessions', ['identityId'], { name: 'sessions_identity_id' });
      await queryInterface.addIndex('sessions', ['refreshTokenHash'], { name: 'sessions_refresh_token_hash' });
    }

    if (!have.has('devices')) {
      await queryInterface.createTable('devices', {
        id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        identityId: { type: Sequelize.STRING, allowNull: false },
        deviceKey: { type: Sequelize.STRING, allowNull: false },
        platform: { type: Sequelize.STRING, allowNull: true },
        pushToken: { type: Sequelize.STRING, allowNull: true },
        trusted: { type: Sequelize.BOOLEAN, defaultValue: false },
        lastSeenAt: { type: Sequelize.DATE, allowNull: true },
        revokedAt: { type: Sequelize.DATE, allowNull: true },
        ...TIMESTAMPS(Sequelize),
      });
      await queryInterface.addIndex('devices', ['identityId'], { name: 'devices_identity_id' });
      await queryInterface.addIndex('devices', ['deviceKey'], { name: 'devices_device_key' });
    }
  },

  // DELIBERATELY REFUSES.
  //
  // Rolling back a baseline means dropping every table in the service — every
  // identity, session and device. No deploy pipeline should be able to reach
  // that by running `migrate down` one step too many. Dropping the schema is a
  // decision made deliberately with a backup in hand, not a reversible step.
  async down() {
    throw new Error(
      'The baseline cannot be rolled back — it would drop every identity, session and device. '
      + 'Restore from a backup instead.',
    );
  },
};
