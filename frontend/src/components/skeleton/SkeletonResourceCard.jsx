import React from 'react';
import Skeleton from './Skeleton';

/**
 * Resource card skeleton loader.
 * Mimics file & link resource items in AdminResources, Student Resources, and TeamLead Resources.
 */
export default function SkeletonResourceCard({ className = '' }) {
  return (
    <div
      className={`bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs space-y-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="w-16 h-3 rounded" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-4/5 h-3" />
      </div>

      <div className="pt-3 border-t border-[#EAE6DC] flex items-center justify-between">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-24 h-7 rounded-lg" />
      </div>
    </div>
  );
}
