import { Skeleton } from '@repo/ui';

export default function SheetFallbackPage() {
  return (
    <div>
      <Skeleton className="h-10 w-72 mb-2 animate-none" />
      <Skeleton className="h-4 w-96  animate-none mb-6" />
      <Skeleton className="h-64 w-full animate-none" />
    </div>
  );
}
