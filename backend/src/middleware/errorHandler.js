/**
 * Catches errors passed via next(err) from any route/controller
 * and returns a consistent JSON error shape. Keep this LAST in
 * the middleware chain in server.js.
 */
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with these details already exists.' });
  }
  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Related record not found or still in use.' });
  }
  // Postgres check_violation / not_null_violation
  if (err.code === '23514' || err.code === '23502') {
    return res.status(400).json({ error: 'Invalid data submitted.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end.' : err.message;
  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
