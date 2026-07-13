import { Skeleton } from '@repo/ui';

export function DayStripSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
      <Skeleton className="h-[58px] w-[60px] shrink-0 rounded-xl" />
    </div>
  );
}
