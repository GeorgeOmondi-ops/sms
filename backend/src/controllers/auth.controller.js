const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/db');
const { logAction } = require('../utils/audit');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/login
 * Public. Authenticates by email + password for any role.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    await logAction({ userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id, ip: req.ip });

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/register
 * Admin-only. Creates a user account for a given role.
 * For 'student' or 'teacher' roles this creates the linked profile row too,
 * inside a transaction so both succeed or both fail together.
 */
async function register(req, res, next) {
  const client = await getClient();
  try {
    const { email, password, role, full_name, phone, profile = {} } = req.body;

    if (!email || !password || !role || !full_name) {
      return res.status(400).json({ error: 'email, password, role, and full_name are required.' });
    }
    const allowedRoles = ['admin', 'teacher', 'student', 'parent'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${allowedRoles.join(', ')}` });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    await client.query('BEGIN');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase().trim(), password_hash, role, full_name, phone || null]
    );
    const user = userResult.rows[0];

    if (role === 'teacher') {
      await client.query(
        `INSERT INTO teachers (user_id, staff_number, department_id, gender, date_of_birth, hire_date, address)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7)`,
        [
          user.id,
          profile.staff_number || `T-${Date.now()}`,
          profile.department_id || null,
          profile.gender || null,
          profile.date_of_birth || null,
          profile.hire_date || null,
          profile.address || null,
        ]
      );
    } else if (role === 'parent') {
      await client.query(
        `INSERT INTO parents (user_id, full_name, phone, address, occupation)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, full_name, phone || null, profile.address || null, profile.occupation || null]
      );
    }
    // Note: 'student' accounts are normally created via POST /api/students
    // (which can also create the linked user login). Direct registration
    // here is supported for admin/parent/teacher; students route handles
    // the richer student-specific fields.

    await client.query('COMMIT');

    await logAction({
      userId: req.user?.id,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user.id,
      details: { role, email: user.email },
      ip: req.ip,
    });

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
async function me(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/change-password
 * Authenticated user changes their own password.
 */
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password are required.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user.id]);

    await logAction({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: user.id, ip: req.ip });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, register, me, changePassword };
