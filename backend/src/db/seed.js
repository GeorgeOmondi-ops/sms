/**
 * Seeds the database with an initial admin account and minimal reference
 * data so you can log in and start using the /api/auth endpoints right away.
 * Fuller sample data (students, classes, attendance, results, fees) is
 * added by the seed scripts in later build steps.
 *
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, query } = require('../config/db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before seeding.');
}

async function seed() {
  console.log('Seeding initial data...');

  const salt = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  const existing = await query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  if (existing.rows.length === 0) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, 'admin', 'System Administrator')`,
      [ADMIN_EMAIL, passwordHash]
    );
    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  } else {
    console.log('• Admin user already exists, skipping.');
  }

  await query(
    `INSERT INTO academic_years (name, start_date, end_date, is_current)
     VALUES ('2025/2026', '2025-09-01', '2026-06-30', TRUE)
     ON CONFLICT (name) DO NOTHING`
  );

  const yearRes = await query(`SELECT id FROM academic_years WHERE name = '2025/2026'`);
  const yearId = yearRes.rows[0].id;

  await query(
    `INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
     VALUES ($1, 'Term 1', '2025-09-01', '2025-12-12', TRUE)
     ON CONFLICT (academic_year_id, name) DO NOTHING`,
    [yearId]
  );

  await query(
    `INSERT INTO departments (name) VALUES ('Sciences'), ('Humanities'), ('Languages'), ('Mathematics')
     ON CONFLICT (name) DO NOTHING`
  );

  await query(
    `INSERT INTO grading_systems (name) VALUES ('Standard A-F')
     ON CONFLICT (name) DO NOTHING`
  );
  const gsRes = await query(`SELECT id FROM grading_systems WHERE name = 'Standard A-F'`);
  const gsId = gsRes.rows[0].id;

  const bands = [
    ['A', 80, 100, 4.0, 'Excellent'],
    ['B', 70, 79.99, 3.0, 'Very Good'],
    ['C', 60, 69.99, 2.0, 'Good'],
    ['D', 50, 59.99, 1.0, 'Fair'],
    ['E', 0, 49.99, 0.0, 'Needs Improvement'],
  ];
  for (const [grade, min, max, gp, remark] of bands) {
    await query(
      `INSERT INTO grade_bands (grading_system_id, grade, min_score, max_score, grade_point, remark)
       SELECT $1::int, $2::varchar(5), $3::numeric, $4::numeric, $5::numeric, $6::varchar(100)
       WHERE NOT EXISTS (
         SELECT 1 FROM grade_bands WHERE grading_system_id = $1::int AND grade = $2::varchar(5)
       )`,
      [gsId, grade, min, max, gp, remark]
    );
  }

  console.log('✓ Reference data seeded (academic year, term, departments, grading system).');
  console.log('Done.');
  await pool.end();
}

seed().catch(async (err) => {
  console.error('Seeding failed:', err);
  await pool.end();
  process.exit(1);
});
