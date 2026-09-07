import { Skeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-12 w-full mb-3" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>

      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
