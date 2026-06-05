import { Card, CardContent } from '@repo/ui';
import { Calendar, Hand, LogIn } from 'lucide-react';
import { CheckOutButton } from '@/domain/shift/components/checkout-button';
import { getDataClient } from '@/lib/data-client';
import { formatDateTime } from '@/lib/formatting';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckOutPageProps {
  params: Promise<{ orgUId: string; checkInId: string }>;
}

export default async function CheckOutPage({ params }: CheckOutPageProps) {
  const { orgUId, checkInId } = await params;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);
  const user = await data.user.findByCheckInId(checkInId);

  if (!user) {
    return;
  }

  const timeEntries = await data.timeEntry.findByUser(user.id);
  const openTimeEntries = timeEntries.items.filter((entry) => !entry.endedAt);

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="page-title">Check-out</h1>
        </div>
        <div className="lg:px-2 lg:py-8 py-4 space-y-4">
          {openTimeEntries.map((entry) => (
            <Card key={entry.id} className="mb-6">
              <CardContent>
                <Card className="mb-4">
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex gap-2">
                        <Calendar className="text-muted-foreground" />
                        {entry.shiftInstance.master.title}
                      </li>
                      <li className="flex gap-2">
                        <LogIn className="text-muted-foreground" /> Checked in:{' '}
                        {formatDateTime(new Date(entry.startedAt))}
                      </li>
                      <li className="flex gap-2">
                        <Hand className="text-muted-foreground" /> Checking out:{' '}
                        {formatDateTime(new Date())}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <CheckOutButton
                  organizationUnitId={orgUId}
                  timeEntryId={entry.id}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
