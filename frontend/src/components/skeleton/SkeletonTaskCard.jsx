import React from 'react';
import Skeleton from './Skeleton';

/**
 * Task item skeleton loader.
 * Mimics tasks in TeamTasks, Batches milestone view, and Student Tasks.
 */
export default function SkeletonTaskCard({ className = '' }) {
  return (
    <div
      className={`bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs space-y-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-20 h-4 rounded" />
          </div>
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-full h-3.5" />
          <Skeleton className="w-2/3 h-3.5" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      </div>

      <div className="pt-3 border-t border-[#EAE6DC] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-28 h-3" />
        </div>
        <Skeleton className="w-20 h-7 rounded-lg" />
      </div>
    </div>
  );
}
