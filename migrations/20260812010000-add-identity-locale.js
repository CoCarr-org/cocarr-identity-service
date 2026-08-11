// Adds `identities.locale`.
//
// A worked example of the EXPAND / CONTRACT pattern, which is how a column is
// changed across releases without downtime and without losing data. The rule:
// at every moment, the schema must work with BOTH the currently-deployed code
// and the code about to deploy — because for the length of a rolling deploy,
// both are running at once.
//
//   EXPAND    (this migration) add the column NULLABLE, with no default that
//             old rows must satisfy. Old code ignores it; new code may write
//             it. Deployable in either order — which is what makes a rollback
//             safe.
//   BACKFILL  (a later migration, or a job) populate existing rows.
//   CONTRACT  (a LATER RELEASE, once no running code writes the old shape)
//             add NOT NULL / drop the superseded column.
//
// Doing expand and contract in one release is the mistake that causes
// downtime: the moment you add NOT NULL, every old container still writing
// without that column starts failing inserts.
//
// A RENAME IS NEVER `renameColumn` ALONE for the same reason — that is one
// atomic change that both old and new code cannot agree on. It is expand
// (add new) → backfill → dual-write → contract (drop old), across two releases.
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('identities');
    // Idempotent: re-running must not fail. Migrations are recorded, so this
    // should not happen — but a half-applied release, or a manual fix that
    // added the column by hand, both leave a database where it already exists.
    if (table.locale) return;

    await queryInterface.addColumn('identities', 'locale', {
      type: Sequelize.STRING(10),
      allowNull: true, // EXPAND: nullable, so existing rows need no backfill to be valid
    });
  },

  // Dropping a column destroys its data, so a `down` that does it is only safe
  // while the column is new and empty — which is exactly the window a rollback
  // happens in. Guarded so it cannot silently delete a populated column.
  async down(queryInterface) {
    const table = await queryInterface.describeTable('identities');
    if (!table.locale) return;

    const [[{ populated }]] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS populated FROM identities WHERE locale IS NOT NULL',
    );
    if (Number(populated) > 0) {
      throw new Error(
        `Refusing to drop identities.locale — ${populated} row(s) have a value. `
        + 'Rolling back would destroy them. Write a migration that preserves the data instead.',
      );
    }
    await queryInterface.removeColumn('identities', 'locale');
  },
};
