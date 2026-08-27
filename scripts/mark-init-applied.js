// One-off: this Supabase DB was created outside node-pg-migrate, so its
// `pgmigrations` tracking table is empty. Record the init migration as already
// applied so `npm run migrate` skips it and runs only the newer migrations.
require('dotenv').config();
const db = require('../src/config/database');

(async () => {
  try {
    const { rowCount } = await db.query(
      `INSERT INTO pgmigrations (name, run_on)
       SELECT '1700000000000_init', now()
       WHERE NOT EXISTS (SELECT 1 FROM pgmigrations WHERE name = '1700000000000_init')`
    );
    console.log(rowCount ? '✓ init migration marked as applied' : '✓ already marked (no change)');
    const { rows } = await db.query('SELECT name, run_on FROM pgmigrations ORDER BY id');
    console.table(rows);
    process.exit(0);
  } catch (e) {
    console.error('✗ failed:', e.message);
    process.exit(1);
  }
})();
