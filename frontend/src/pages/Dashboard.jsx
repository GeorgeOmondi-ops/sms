import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const GREETING = {
  admin: 'Here is what’s happening across the school today.',
  teacher: 'Here is an overview of your classes today.',
  student: 'Here is your academic snapshot.',
  parent: 'Here is an overview of your children’s progress.',
};

export default function RoleDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.full_name?.split(' ')[0]} </h1>
        <p className="mt-1 text-slate-500">{GREETING[user?.role] || ''}</p>
      </div>

      <div className="card p-6">
        <p className="text-sm text-slate-500">
          You're logged in as <span className="font-semibold capitalize text-slate-700">{user?.role}</span>.
          The full dashboard still wirking on it 
          (students, attendance, exams, fees) . Authentication
          and role-based routing, which this screen demonstrates, are complete.
        </p>
      </div>
    </div>
  );
}
