import React from 'react';
import Skeleton from './Skeleton';

/**
 * Metric & KPI stat card skeleton.
 * Mimics metric cards in Admin Overview, Batches, and Student Dashboard.
 */
export default function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-3.5" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>

      <div className="flex items-baseline gap-2">
        <Skeleton className="w-16 h-8 rounded-md" />
        <Skeleton className="w-14 h-4 rounded-full" />
      </div>

      <Skeleton className="w-28 h-3" />
    </div>
  );
}
