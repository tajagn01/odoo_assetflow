import React from "react";

export default function SkeletonLoader() {
  return (
    <div className="w-full space-y-6 font-sans select-none animate-pulse">
      
      {/* Header Skeleton */}
      <div className="border-b border-zinc-200 pb-4 space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-100 rounded" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm h-32">
            <div className="h-4 w-24 bg-zinc-200 rounded" />
            <div className="h-8 w-16 bg-zinc-300 rounded-lg" />
            <div className="h-3.5 w-full bg-zinc-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content Table Skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
          <div className="h-5 w-32 bg-zinc-200 rounded" />
          <div className="h-8 w-24 bg-zinc-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
              <div className="flex items-center space-x-3 w-1/3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3.5 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-zinc-100 rounded-full" />
              <div className="h-4 w-32 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
