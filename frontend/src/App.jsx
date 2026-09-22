import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import RoleDashboard from './pages/Dashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import { Unauthorized, NotFound } from './pages/StatusPages.jsx';

// Section routes per role, rendered as children of DashboardLayout's <Outlet/>.
const ADMIN_CHILDREN = [
  { path: 'students', title: 'Student Management' },
  { path: 'teachers', title: 'Teacher Management' },
  { path: 'classes', title: 'Classes & Subjects' },
  { path: 'attendance', title: 'Attendance Overview' },
  { path: 'exams', title: 'Examinations & Results' },
  { path: 'fees', title: 'Fees & Finance' },
  { path: 'announcements', title: 'Announcements' },
  { path: 'reports', title: 'Reports' },
  { path: 'settings', title: 'System Settings' },
];

const TEACHER_CHILDREN = [
  { path: 'classes', title: 'My Classes' },
  { path: 'attendance', title: 'Record Attendance' },
  { path: 'marks', title: 'Marks Entry' },
  { path: 'materials', title: 'Learning Materials' },
  { path: 'announcements', title: 'Announcements' },
];

const STUDENT_CHILDREN = [
  { path: 'profile', title: 'My Profile' },
  { path: 'attendance', title: 'My Attendance' },
  { path: 'results', title: 'My Results' },
  { path: 'fees', title: 'My Fees' },
  { path: 'announcements', title: 'Announcements' },
];

const PARENT_CHILDREN = [
  { path: 'children', title: 'My Children' },
  { path: 'attendance', title: 'Attendance' },
  { path: 'results', title: 'Results' },
  { path: 'fees', title: 'Fees' },
  { path: 'announcements', title: 'Announcements' },
];

function roleSection(role, children) {
  return (
    <Route
      key={role}
      path={`/${role}`}
      element={
        <ProtectedRoute roles={[role]}>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<RoleDashboard />} />
      {children.map((c) => (
        <Route key={c.path} path={c.path} element={<ComingSoon title={c.title} />} />
      ))}
    </Route>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {roleSection('admin', ADMIN_CHILDREN)}
      {roleSection('teacher', TEACHER_CHILDREN)}
      {roleSection('student', STUDENT_CHILDREN)}
      {roleSection('parent', PARENT_CHILDREN)}

      <Route
        path="/"
        element={user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
