import React from 'react';
import Skeleton from './Skeleton';

/**
 * Table skeleton loader.
 * Renders structured rows mimicking user lists, recent registrations, or roster tables.
 */
export default function SkeletonTable({ rows = 5, showHeader = false, rowsOnly = false, className = '' }) {
  const content = (
    <div className="divide-y divide-[#E2DDD0]">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 sm:px-6 flex items-center justify-between gap-4"
        >
          {/* User Info / Avatar */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-12 h-3.5 rounded" />
              </div>
              <Skeleton className="w-44 h-3" />
            </div>
          </div>

          {/* Badges & Metadata */}
          <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-20 h-3.5 hidden sm:block" />
          </div>
        </div>
      ))}
    </div>
  );

  if (rowsOnly) return content;

  return (
    <div className={`bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden ${className}`}>
      {showHeader && (
        <div className="p-5 sm:px-6 border-b border-[#E0DDD0] flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-64 h-3.5" />
          </div>
          <Skeleton className="w-24 h-4 rounded-md" />
        </div>
      )}
      {content}
    </div>
  );
}
