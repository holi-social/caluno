import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You don't have permission to access this organization.</p>
        <Link href="/" className="text-primary hover:underline">
          Go to your organizations
        </Link>
      </div>
    </div>
  );
}
