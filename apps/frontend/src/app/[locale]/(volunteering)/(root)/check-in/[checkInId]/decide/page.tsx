import { Button, Card, CardContent, Separator } from '@repo/ui';
import { Building2, Calendar, LogIn, ScanQrCode } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { Link, redirect } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { getMyCheckInOrgUnits } from '@/lib/org-context-server';

interface DecidePageProps {
  params: Promise<{ locale: string; checkInId: string }>;
  searchParams: Promise<{ orgUId?: string }>;
}

export default async function VolunteeringDecidePage({
  params,
  searchParams,
}: DecidePageProps) {
  const { locale, checkInId } = await params;
  const { orgUId: orgUIdParam } = await searchParams;

  const checkInOrgUnits = await getMyCheckInOrgUnits();
  if (checkInOrgUnits.length === 0) {
    redirect({ href: '/check-in', locale });
  }

  const data = await getDataClient();
  const context = await data.timeEntry.getCheckInContext(checkInId);
  if (!context) {
    notFound();
  }

  // The check-in page resolves its own org unit from the caller's
  // check-in:manage units; `orgUId` is forwarded only as a preference.
  const checkInHref = orgUIdParam
    ? `/check-in/${checkInId}/check-in?orgUId=${encodeURIComponent(orgUIdParam)}`
    : `/check-in/${checkInId}/check-in`;

  // Nothing to check out -> straight to check-in.
  if (context.openTimeEntries.length === 0) {
    redirect({ href: checkInHref, locale });
  }

  const t = await getTranslations('CheckIn');
  const tShiftCheckIn = await getTranslations('Shift.checkIn');
  const { formatDateTime } = await getFormatting();

  return (
    <div className="max-w-2xl px-4 py-8 space-y-6">
      <UserCard user={context.volunteer} size="lg" />

      {context.openTimeEntries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('openEntriesTitle')}</h2>
          {context.openTimeEntries.map((entry) => (
            <Link
              key={entry.id}
              href={`/check-in/${checkInId}/check-out?entryId=${entry.id}`}
              className="block"
            >
              <Card>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      {entry.organizationUnit.name}
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      {entry.shiftInstance
                        ? (entry.shiftInstance.overrideTitle ??
                          entry.shiftInstance.master.title)
                        : tShiftCheckIn('generalCheckIn')}
                    </li>
                    <li className="flex items-center gap-2">
                      <ScanQrCode className="size-4 text-muted-foreground" />
                      {tShiftCheckIn('checkedInAt', {
                        time: formatDateTime(new Date(entry.startedAt)),
                      })}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Separator />
        </div>
      )}

      <Button asChild size="lg" className="w-full">
        <Link href={checkInHref}>
          <LogIn /> {t('checkInButton')}
        </Link>
      </Button>
    </div>
  );
}
