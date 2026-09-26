import React from 'react';
import Skeleton from './Skeleton';

/**
 * Table skeleton loader.
 * Renders structured rows mimicking user lists, recent registrations, or roster tables.
 */
export default function SkeletonTable({ rows = 5, showHeader = false, rowsOnly = false, className = '' }) {
  const content = (
    <div className="overflow-x-auto custom-scroll w-full">
      <div className="divide-y divide-[#E2DDD0] min-w-[520px]">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_120px_100px] gap-4 items-center px-4 sm:px-6 py-3.5"
          >
            {/* User Info / Avatar */}
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-28 sm:w-36 h-4" />
                  <Skeleton className="w-10 h-3.5 rounded" />
                </div>
                <Skeleton className="w-36 sm:w-44 h-3" />
              </div>
            </div>

            {/* Badges & Metadata */}
            <div className="flex justify-center">
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="w-16 h-3.5" />
            </div>
          </div>
        ))}
      </div>
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
