import React from 'react';
import Skeleton from './Skeleton';

/**
 * Cohort team card skeleton.
 * Mimics cohort team cards in Batches and TeamOverview.
 */
export default function SkeletonCohortCard({ className = '' }) {
  return (
    <div
      className={`bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs space-y-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4.5" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-12 h-6 rounded-full" />
      </div>

      <div className="space-y-2 py-1">
        <div className="flex justify-between">
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-24 h-3" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-[#EAE6DC]">
        <div className="flex justify-between">
          <Skeleton className="w-14 h-3" />
          <Skeleton className="w-10 h-3" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>
    </div>
  );
}
