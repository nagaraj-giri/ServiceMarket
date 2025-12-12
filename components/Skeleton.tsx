
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular', width, height }) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  const variantClasses = {
    text: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    ></div>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="w-full">
    <div className="flex gap-4 mb-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-full">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <Skeleton className="h-4 w-full mt-2" />
  </div>
);
