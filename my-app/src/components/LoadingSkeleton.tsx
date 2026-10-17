import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
        ))}
      </div>

      {/* Charts & Categories Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 rounded-xl"></div>
        <div className="h-72 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Transactions Skeleton */}
      <div className="h-64 bg-slate-200 rounded-xl"></div>
    </div>
  );
};
