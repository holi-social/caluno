import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { getLastVisitedOrgServer } from '@/lib/org-context-server';

type CheckInPageProps = {
  params: Promise<{ checkInId: string }>;
};

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { checkInId } = await params;

  const lastVisitedOrganizationId = await getLastVisitedOrgServer();

  if (lastVisitedOrganizationId) {
    return redirect(
      `/${lastVisitedOrganizationId}/check-in/${checkInId}/decide`,
    );
  }

  const data = await getDataClient();

  const organizations = await data.user.getMyOrganizations({
    limit: 100,
    offset: 0,
  });

  if (organizations.items.length === 1) {
    return redirect(
      `/${organizations.items[0]?.id}/check-in/${checkInId}/decide`,
    );
  }

  return (
    <div className="flex justify-center p-4 pt-20">
      <Card className="w-2xl">
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
          <CardDescription>
            Choose your the organization you want to check the volunteer into.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.items.map((o) => (
            <Link
              key={o.id}
              href={`/${o.id}/check-in/${checkInId}/decide`}
              className="flex gap-4 items-center text-xl"
            >
              {o.name}
              <Button type="button" size="icon-sm">
                <LogIn />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
