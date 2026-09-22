const { Pool } = require('pg');
require('dotenv').config();

// Supports either a full DATABASE_URL or discrete PG* env vars.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

pool.on('error', (err) => {
  // Unexpected errors on idle clients — log and let the process supervisor restart if needed.
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Run a single query. Prefer this for most operations.
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    const duration = Date.now() - start;
    console.log('[db]', { text: text.split('\n')[0].slice(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Get a dedicated client for multi-statement transactions.
 * Caller MUST release() the client when done.
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

module.exports = { pool, query, getClient };
