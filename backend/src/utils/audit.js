const { query } = require('../config/db');

/**
 * Records an administrative/security-relevant action.
 * Never throws — an audit-log failure should not break the main request.
 */
async function logAction({ userId, action, entityType, entityId, details, ip }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ip || null]
    );
  } catch (err) {
    console.error('[audit] failed to write log entry:', err.message);
  }
}

module.exports = { logAction };
