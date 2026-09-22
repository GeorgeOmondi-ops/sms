import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SCHOOL_NAME } from '../config/school.js';

const NAV_BY_ROLE = {
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Students', to: '/admin/students' },
    { label: 'Teachers', to: '/admin/teachers' },
    { label: 'Classes', to: '/admin/classes' },
    { label: 'Attendance', to: '/admin/attendance' },
    { label: 'Examinations', to: '/admin/exams' },
    { label: 'Fees', to: '/admin/fees' },
    { label: 'Announcements', to: '/admin/announcements' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Settings', to: '/admin/settings' },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher' },
    { label: 'My Classes', to: '/teacher/classes' },
    { label: 'Attendance', to: '/teacher/attendance' },
    { label: 'Marks Entry', to: '/teacher/marks' },
    { label: 'Materials', to: '/teacher/materials' },
    { label: 'Announcements', to: '/teacher/announcements' },
  ],
  student: [
    { label: 'Dashboard', to: '/student' },
    { label: 'My Profile', to: '/student/profile' },
    { label: 'Attendance', to: '/student/attendance' },
    { label: 'Results', to: '/student/results' },
    { label: 'Fees', to: '/student/fees' },
    { label: 'Announcements', to: '/student/announcements' },
  ],
  parent: [
    { label: 'Dashboard', to: '/parent' },
    { label: 'My Children', to: '/parent/children' },
    { label: 'Attendance', to: '/parent/attendance' },
    { label: 'Results', to: '/parent/results' },
    { label: 'Fees', to: '/parent/fees' },
    { label: 'Announcements', to: '/parent/announcements' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            E
          </div>
          <span className="text-lg font-bold text-slate-900">{SCHOOL_NAME}</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${user?.role}`}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="hidden text-sm font-medium text-slate-500 lg:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{user?.full_name}</div>
              <div className="text-xs capitalize text-slate-400">{user?.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
