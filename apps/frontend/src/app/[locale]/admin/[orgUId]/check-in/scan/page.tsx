import { Separator } from '@repo/ui';
import { getTranslations } from 'next-intl/server';
import { CheckInInput } from '@/domain/shift/components/check-in-input';
import { CheckInScanner } from '@/domain/shift/components/check-in-scanner';
import { CheckInSelector } from '@/domain/shift/components/check-in-selector';
import { getDataClient } from '@/lib/data-client';

interface ScanPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { orgUId } = await params;
  const t = await getTranslations('Shift.checkIn');

  const data = await getDataClient({ orgUId });

  const volunteers = await data.organization.findVolunteersByUnit(orgUId);

  return (
    <div className="max-w-2xl">
      <div>
        <h1 className="page-title">{t('checkInTitle')}</h1>
        <p className="text-muted-foreground">{t('scanDescription')}</p>
      </div>
      <div className="px-2 py-8">
        <div className="max-w-lg">
          <CheckInScanner organizationUnitId={orgUId} />
        </div>
        <Separator className="my-6" />
        <h2 className="text-lg mb-2">{t('enterQrTitle')}</h2>

        <CheckInInput organizationUnitId={orgUId} />

        <Separator className="my-6" />

        <h2 className="text-lg mb-2">{t('searchVolunteerTitle')}</h2>
        <CheckInSelector volunteers={volunteers} organizationUnitId={orgUId} />
      </div>
    </div>
  );
}
