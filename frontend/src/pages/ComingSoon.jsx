import React from 'react';

/**
 *my next step the page is pending
 * (students, classes, attendance, exams, fees, announcements, reports).
 */
export default function ComingSoon({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-16 text-center">
      <div className="text-3xl"></div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="max-w-sm text-sm text-slate-500">
        This module will be built next. The
        navigation, layout, and API route are already wired up for it.
      </p>
    </div>
  );
}
