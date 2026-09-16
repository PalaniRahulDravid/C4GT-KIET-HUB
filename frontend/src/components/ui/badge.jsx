import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-slate-900 text-white shadow-2xs',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    outline: 'border border-slate-200 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
