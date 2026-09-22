-- =====================================================================
-- Student Management System — PostgreSQL Schema
-- =====================================================================
-- Run with: psql -U <user> -d <database> -f schema.sql
-- Designed with PKs, FKs, indexes, constraints, and timestamps.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'mobile_money', 'other');
CREATE TYPE announcement_audience AS ENUM ('all', 'class', 'students', 'teachers', 'parents');
CREATE TYPE relation_type AS ENUM ('father', 'mother', 'guardian', 'other');

-- ---------------------------------------------------------------------
-- CORE: USERS (single table for login across all roles)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ---------------------------------------------------------------------
-- ACADEMIC YEARS & TERMS
-- ---------------------------------------------------------------------
CREATE TABLE academic_years (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,   -- e.g. '2025/2026'
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE terms (
    id                SERIAL PRIMARY KEY,
    academic_year_id  INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name              VARCHAR(50) NOT NULL,    -- e.g. 'Term 1'
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    is_current        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (academic_year_id, name)
);

-- ---------------------------------------------------------------------
-- DEPARTMENTS, CLASSES, SUBJECTS
-- ---------------------------------------------------------------------
CREATE TABLE departments (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE teachers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_number      VARCHAR(50) NOT NULL UNIQUE,
    department_id     INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    gender            gender_type,
    date_of_birth     DATE,
    hire_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    address           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE classes (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,        -- e.g. 'Grade 10A'
    academic_year_id  INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_teacher_id  UUID REFERENCES teachers(id) ON DELETE SET NULL,
    capacity          INTEGER DEFAULT 40,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, academic_year_id)
);

CREATE TABLE subjects (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    code          VARCHAR(20) NOT NULL UNIQUE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which subjects are taught in which class, by which teacher
CREATE TABLE class_subjects (
    id          SERIAL PRIMARY KEY,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id  UUID REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE (class_id, subject_id)
);
CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);

-- ---------------------------------------------------------------------
-- STUDENTS & PARENTS/GUARDIANS
-- ---------------------------------------------------------------------
CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    admission_number    VARCHAR(50) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    gender              gender_type NOT NULL,
    date_of_birth       DATE NOT NULL,
    nationality         VARCHAR(100),
    phone               VARCHAR(30),
    email               VARCHAR(255),
    address             TEXT,
    class_id            INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    academic_year_id    INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
    admission_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    previous_school     VARCHAR(255),
    photo_url           TEXT,
    emergency_contact_name  VARCHAR(255),
    emergency_contact_phone VARCHAR(30),
    medical_notes       TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_name ON students USING gin (to_tsvector('english', full_name));
CREATE INDEX idx_students_active ON students(is_active);

CREATE TABLE parents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR(255) NOT NULL,
    phone       VARCHAR(30),
    address     TEXT,
    occupation  VARCHAR(150),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Many-to-many: a student can have multiple guardians; a parent can have multiple children
CREATE TABLE student_parents (
    id          SERIAL PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id   UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    relation    relation_type NOT NULL DEFAULT 'guardian',
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (student_id, parent_id)
);
CREATE INDEX idx_student_parents_student ON student_parents(student_id);
CREATE INDEX idx_student_parents_parent ON student_parents(parent_id);

-- ---------------------------------------------------------------------
-- ATTENDANCE
-- ---------------------------------------------------------------------
CREATE TABLE attendance (
    id            BIGSERIAL PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id      INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    status        attendance_status NOT NULL,
    recorded_by   UUID REFERENCES teachers(id) ON DELETE SET NULL,
    remarks       VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, date)
);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- ---------------------------------------------------------------------
-- EXAMINATIONS, GRADING, RESULTS
-- ---------------------------------------------------------------------
CREATE TABLE grading_systems (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE   -- e.g. 'Standard A-F'
);

CREATE TABLE grade_bands (
    id                SERIAL PRIMARY KEY,
    grading_system_id INTEGER NOT NULL REFERENCES grading_systems(id) ON DELETE CASCADE,
    grade             VARCHAR(5) NOT NULL,   -- 'A', 'B+', etc.
    min_score         NUMERIC(5,2) NOT NULL,
    max_score         NUMERIC(5,2) NOT NULL,
    grade_point       NUMERIC(3,2) NOT NULL DEFAULT 0,
    remark            VARCHAR(100)
);

CREATE TABLE exams (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,     -- e.g. 'Mid-Term Exam'
    term_id           INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    class_id          INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    grading_system_id INTEGER REFERENCES grading_systems(id) ON DELETE SET NULL,
    start_date        DATE,
    end_date          DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_subjects (
    id          SERIAL PRIMARY KEY,
    exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    max_marks   NUMERIC(6,2) NOT NULL DEFAULT 100,
    exam_date   DATE,
    UNIQUE (exam_id, subject_id)
);

CREATE TABLE results (
    id              BIGSERIAL PRIMARY KEY,
    exam_id         INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id      INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    marks_obtained  NUMERIC(6,2) NOT NULL CHECK (marks_obtained >= 0),
    grade           VARCHAR(5),
    grade_point     NUMERIC(3,2),
    teacher_comment TEXT,
    entered_by      UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (exam_id, student_id, subject_id)
);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_exam ON results(exam_id);

-- Overall report-card level remarks per student per exam
CREATE TABLE report_cards (
    id                    BIGSERIAL PRIMARY KEY,
    exam_id               INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    average_marks         NUMERIC(6,2),
    overall_grade         VARCHAR(5),
    class_position         INTEGER,
    class_teacher_comment TEXT,
    principal_comment     TEXT,
    generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (exam_id, student_id)
);

-- ---------------------------------------------------------------------
-- FEES & PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE fee_structures (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,      -- e.g. 'Term 1 Tuition'
    class_id          INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id  INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id           INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    due_date          DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fee assigned/invoiced to an individual student (allows overrides/scholarships)
CREATE TABLE student_fees (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id  INTEGER NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    amount_due        NUMERIC(12,2) NOT NULL CHECK (amount_due >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, fee_structure_id)
);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_id  UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method          payment_method NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(100),   -- transaction ref (e.g. M-Pesa code) for future API integration
    receipt_number  VARCHAR(50) NOT NULL UNIQUE,
    received_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           VARCHAR(255)
);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_fee ON payments(student_fee_id);

-- ---------------------------------------------------------------------
-- ANNOUNCEMENTS & NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE announcements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    body          TEXT NOT NULL,
    audience      announcement_audience NOT NULL DEFAULT 'all',
    class_id      INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ,
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_class ON announcements(class_id);

CREATE TABLE notifications (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    announcement_id  UUID REFERENCES announcements(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    body             TEXT,
    is_read          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- LEARNING MATERIALS (Teacher uploads)
-- ---------------------------------------------------------------------
CREATE TABLE learning_materials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,      -- e.g. 'STUDENT_CREATED'
    entity_type VARCHAR(100),
    entity_id   VARCHAR(100),
    details     JSONB,
    ip_address  VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_results_updated_at BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
