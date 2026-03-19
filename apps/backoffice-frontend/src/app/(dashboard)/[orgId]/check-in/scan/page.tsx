import { Separator } from '@repo/ui';
import { CheckinScanner } from '@/domain/shift/check-in-scanner';
import { VolunteerCheckin } from '@/domain/shift/components/volunteer-checkin';
import { getDataClient } from '@/lib/data-client';

interface ScanPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { orgId } = await params;

  const data = await getDataClient(orgId);

  const volunteers = (await data.organization.findVolunteers(orgId)) || [];

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
          <p className="text-muted-foreground">
            Scan the volunteers QR iD to check them in
          </p>
        </div>
        <div className="px-2 py-8">
          <div className="max-w-lg">
            <CheckinScanner organizationId={orgId} />
          </div>
          <Separator className="my-6" />
          <h2 className="text-lg mb-2">Or search for a volunteer</h2>
          <VolunteerCheckin volunteers={volunteers} organizationId={orgId} />
        </div>
      </div>
    </div>
  );
}
