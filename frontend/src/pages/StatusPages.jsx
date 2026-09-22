import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Compass } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center">
      <div className="mb-2 text-amber-500">
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access restricted</h1>
      <p className="max-w-sm text-sm text-slate-500">
        You do not have permission to view this page.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Go back
      </Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3
     bg-slate-50 text-center">

      <div className="mb-2 text-brand-500">
        <Compass className="h-16 w-16" />
      </div>
      <h1 
      className="text-2xl font-bold text-slate-900">Page not found
      </h1>
      
      <p className="max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Go home
      </Link>
    </div>
  );
}
