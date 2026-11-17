import React from 'react';
import { Skeleton } from '../ui/skeleton';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 6, columns = 5, className = '' }: TableSkeletonProps) {
  return (
    <div className={`w-full space-y-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}>
      {/* Header bar */}
      <div className="flex items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      {/* Row items */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5 px-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/30">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
