import { Skeleton } from '@repo/ui';

export function ShiftDetailSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Skeleton className="h-60 w-full md:h-[300px]" />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
        <div className="flex flex-col md:grid md:grid-cols-[680px_392px] md:gap-12">
          <Skeleton className="order-1 h-80 w-full" />
          <div className="order-2 mt-6 space-y-6 md:mt-0">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
