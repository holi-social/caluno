import { Skeleton } from '@repo/ui';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-12 w-full mb-3" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
