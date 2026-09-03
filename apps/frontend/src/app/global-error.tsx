'use client';

import { Button } from '@repo/ui';
import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Something went wrong</p>
            {error.digest && (
              <p className="text-xs mt-1 opacity-70">ID: {error.digest}</p>
            )}
          </div>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
