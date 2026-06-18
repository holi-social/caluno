import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Access Denied',
};

interface UnauthorizedPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        {message ? (
          <p className="text-muted-foreground">{message}</p>
        ) : (
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
        )}
        <Link href="/" className="text-primary hover:underline">
          Go to your organizations
        </Link>
      </div>
    </div>
  );
}
