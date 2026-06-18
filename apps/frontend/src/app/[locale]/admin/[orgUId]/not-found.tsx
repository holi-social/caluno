import { Link } from '@/i18n/navigation';

export default function OrgNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
        <p>The organization you're looking for doesn't exist.</p>
        <Link href="/" className="text-primary hover:underline">
          Go to your organizations
        </Link>
      </div>
    </div>
  );
}
