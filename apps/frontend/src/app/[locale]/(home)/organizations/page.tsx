import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { getMyAccessibleOrganizationUnits } from '@/lib/org-context-server';

export default async function OrganizationsPage() {
  const session = await getSession();

  if (!session?.user) {
    return redirect('/login');
  }

  const organizations = await getMyAccessibleOrganizationUnits();

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Organizations</h1>
        <p className="text-muted-foreground">
          Select an organization to continue
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Link key={org.id} href={`/admin/${org.id}`}>
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
