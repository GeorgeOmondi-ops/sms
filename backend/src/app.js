const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Basic brute-force protection on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Routes ----
// Step 4 (this step): authentication + role-based access control
app.use('/api/auth', authRoutes);

// Step 5+ (added in subsequent iterations of this build):
// app.use('/api/students', require('./routes/students.routes'));
// app.use('/api/teachers', require('./routes/teachers.routes'));
// app.use('/api/classes', require('./routes/classes.routes'));
// app.use('/api/subjects', require('./routes/subjects.routes'));
// app.use('/api/attendance', require('./routes/attendance.routes'));
// app.use('/api/exams', require('./routes/exams.routes'));
// app.use('/api/results', require('./routes/results.routes'));
// app.use('/api/fees', require('./routes/fees.routes'));
// app.use('/api/payments', require('./routes/payments.routes'));
// app.use('/api/announcements', require('./routes/announcements.routes'));
// app.use('/api/reports', require('./routes/reports.routes'));
// app.use('/api/dashboard', require('./routes/dashboard.routes'));

// ---- 404 + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
