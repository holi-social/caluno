import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

export default async function OrganizationsPage() {
  const session = await getSession();

  if (!session?.user) {
    return redirect('/login');
  }

  const data = await getDataClient();
  const orgsResult = await data.user.getMyOrganizations({
    limit: 100,
    offset: 0,
  });

  if (orgsResult.pagination.total === 0) {
    return redirect('/create-organization');
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Organizations</h1>
        <p className="text-muted-foreground">
          Select an organization to continue
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orgsResult.items.map((org) => (
          <Link key={org.id} href={`/${org.slug}/shifts`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                {org.description && (
                  <CardDescription>{org.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
