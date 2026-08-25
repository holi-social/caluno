import { Skeleton } from '@repo/ui';

export function OrgDetailSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Skeleton className="h-60 w-full md:h-[300px]" />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
          <Skeleton className="order-2 h-80 w-full min-w-0 lg:order-1 lg:max-w-[680px] lg:flex-1" />
          <div className="order-1 min-w-0 space-y-4 lg:order-2 lg:w-[392px] lg:shrink-0">
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
