'use client';

import { Button } from '@repo/ui';
import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">{error.message}</p>
          {error.digest && (
            <p className="text-xs mt-1 opacity-70">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
