# EduManage — Student Management System

A full-stack, role-based Student Management System for a school or college:
**React + Vite + Tailwind** frontend, **Node.js + Express** REST API, **PostgreSQL** database.

> **Build status:** This is being built step by step,each
> step fully working before the next starts. **Already completed for steps—
> project structure, database schema, backend + DB connection, and
> authentication with role-based access control (admin / teacher / student /
> parent). Everything below runs and works end-to-end today. Modules shown as

> What next in the UI (students, classes, attendance, exams, fees,
> announcements, reports, dashboard stats) 

---

## 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your PostgreSQL credentials and a real JWT_SECRET
```

Create the database, then load the schema:

```bash
createdb school_sms
psql -U <your_pg_user> -d school management system -f src/db/schema.sql
```

i have Seed an initial admin account and reference data (academic year, term,
departments, grading bands):

```bash
node src/db/seed.js
```

This prints the seeded admin login, by default:

```
admin@school.test / Admin@12345
```

Start the API:

npm run dev

## 3. Frontend setup


cd frontend
npm install
npm run dev
```


Log in with the seeded admin account above. You'll land on the admin
dashboard shell with the full navigation for every module already wired up.

## 4. What's implemented right now

- **Database schema** (`backend/src/db/schema.sql`) — every entity from the
  spec: users, students, parents, teachers, classes, subjects, academic
  years/terms, attendance, exams/results/report cards, fee
  structures/payments, announcements/notifications, learning materials, and
  audit logs — with primary/foreign keys, constraints, and indexes.

- **Auth API** (`/api/auth`):
  - `POST /api/auth/login` — email + password, returns a JWT
  - `POST /api/auth/register` — admin-only, creates teacher/parent/admin
    accounts (student accounts are created via the students module,)

  - `GET /api/auth/me` — current user from the token
  - `POST /api/auth/change-password`
  - Passwords hashed with bcrypt; rate limiting on login; audit log entries
    written for login, registration, and password changes.
- **Role-based access control** — `authenticate` + `authorize(...roles)`
  middleware protecting routes; the frontend mirrors this with a
  `ProtectedRoute` component and per-role route trees.
- **Frontend shell** — login page, auth context with token persistence and
  session refresh, sidebar + topbar dashboard layout, and a full navigation
  structure for all four roles (admin/teacher/student/parent), each pointing
  at its future module page.

// still working on it
## 5. step 5

| Step | Module |
|------|--------|
| 5 | Student management (CRUD, search/filter, photo upload, Excel/CSV import-export) |
| 6 | Classes, subjects, academic years/terms management |
| 7 | Attendance (daily/weekly/monthly, percentages, reports) |
| 8 | Exams & results (marks entry, grading, report cards, PDF) |
| 9 | Fees & payments (structures, receipts, balances) |
| 10 | Announcements & notifications |
| 11 | Reports (view/print/PDF/Excel across modules) |
| 12 | Dashboard analytics (stat cards + charts) |
| 13 | Testing & security hardening pass |
| 14 | Final UI/UX polish |

Ask to continue with "Step 5" (or any step) and it'll be added on top of this
working base, following the same pattern: real endpoints, real queries, real
UI — no mocked data left in place of the finished feature.

## 6.  full project structure

```
sms/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL pool
│   │   ├── controllers/          # route handlers
│   │   ├── routes/                # Express routers, mounted under /api/*
│   │   ├── middleware/            # auth (JWT + RBAC), error handler
│   │   ├── utils/                 # audit logging, etc.
│   │   ├── db/schema.sql          # full database schema
│   │   ├── db/seed.js             # initial admin + reference data
│   │   ├── app.js                 # Express app (middleware + routes)
│   │   └── server.js              # entrypoint
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js           # API client with JWT + 401 handling
    │   ├── context/AuthContext.jsx
    │   ├── components/ProtectedRoute.jsx
    │   ├── layouts/DashboardLayout.jsx   # sidebar + topbar shell
    │   ├── pages/                 # Login, RoleDashboard, ComingSoon, etc.
    │   └── App.jsx                 # role-based route tree
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```
