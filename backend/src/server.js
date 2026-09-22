require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Fail fast if the database is unreachable, with a clear message.
    await pool.query('SELECT 1');
    console.log('✓ Connected to PostgreSQL');
  } catch (err) {
    console.error('✗ Could not connect to PostgreSQL. Check your .env settings.');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✓ Student Management System API running on http://localhost:${PORT}`);
  });
}

start();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing pool...');
  await pool.end();
  process.exit(0);
});
