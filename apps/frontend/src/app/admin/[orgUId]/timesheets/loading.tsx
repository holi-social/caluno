import { Skeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}
