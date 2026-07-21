import { Skeleton } from '@repo/ui';

export function ShiftDetailSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Skeleton className="h-60 w-full md:h-[300px]" />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
        <div className="flex flex-col md:flex-row md:gap-12">
          <Skeleton className="order-1 h-80 w-full min-w-0 md:order-2 md:w-[392px] md:shrink-0" />
          <div className="order-2 mt-6 min-w-0 space-y-6 md:order-1 md:mt-0 md:max-w-[680px] md:flex-1">
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
