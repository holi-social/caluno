import { formatRrulePattern } from '@repo/data';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Calendar,
  CalendarFold,
  CalendarSync,
  Clock,
  ClockPlus,
  FileText,
  LockKeyholeOpen,
  MapPin,
  User,
  UserPlus,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { getVisibilityConfig } from '@/domain/shift/components/shifts-table';
import { parseShiftListQuery } from '@/domain/shift/routes';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting-server';
import { ShiftViewActionBar } from './shift-view-action-bar';

interface ShiftViewPageProps {
  params: Promise<{ orgUId: string; shiftId: string }>;
  searchParams: Promise<{
    view?: string;
    week?: string;
    page?: string;
  }>;
}

export default async function ShiftViewPage({
  params,
  searchParams,
}: ShiftViewPageProps) {
  const { orgUId, shiftId } = await params;
  const returnQuery = parseShiftListQuery(await searchParams);

  const t = await getTranslations('Shift');
  const data = await getDataClient(orgUId);
  const { formatDateTime, formatRange } = await getFormatting();
  const visibilityConfig = getVisibilityConfig(t);
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  const startsAt = new Date(shift.originalStartsAt);
  const endsAt = new Date(startsAt.getTime() + shift.durationMinutes * 60000);
  const isFinished = new Date() > endsAt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title line-clamp-2">{shift.title}</h1>
          <p className="text-muted-foreground mt-1">{t('page.subtitle')}</p>
        </div>
        <div className="shrink-0">
          <ShiftViewActionBar
            id={shiftId}
            organizationUnitId={orgUId}
            size="sm"
            returnQuery={returnQuery}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex gap-2">
                  <Calendar className="text-muted-foreground shrink-0" />
                  <span>{formatRange(startsAt, endsAt)}</span>
                </li>
                <li className="flex gap-2">
                  <CalendarSync className="text-muted-foreground shrink-0" />
                  <span>{formatRrulePattern(shift.rrule)}</span>
                </li>
                {shift.location && (
                  <li className="flex gap-2">
                    <MapPin className="text-muted-foreground shrink-0" />
                    <span>{shift.location}</span>
                  </li>
                )}
                {shift.instructions && (
                  <li className="flex gap-2">
                    <FileText className="text-muted-foreground shrink-0" />
                    <p className="whitespace-pre-wrap break-words min-w-0">
                      {shift.instructions}
                    </p>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>
                  {t('detail.volunteersTitle')}{' '}
                  <Badge variant="outline">
                    {shift.maxVolunteers
                      ? t('detail.volunteersBadgeWithMax', {
                          count: 0,
                          max: shift.maxVolunteers,
                        })
                      : t('detail.volunteersBadge', { count: 0 })}
                  </Badge>
                </span>
                <Button size="xs">
                  <UserPlus /> {t('detail.inviteButton')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('detail.volunteersEmpty')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>
                  {t('detail.timesheetsTitle')}{' '}
                  <Badge variant="outline">
                    {t('detail.timesheetsBadge', { count: 0 })}
                  </Badge>
                </span>
                <Button size="xs">
                  <ClockPlus /> {t('detail.addTimeButton')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('detail.timesheetsEmpty')}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <LockKeyholeOpen className="size-4 shrink-0" />{' '}
                    {t('detail.visibilityLabel')}
                  </dt>
                  <dd className="ml-6">
                    <Badge variant={visibilityConfig[shift.visibility].variant}>
                      {visibilityConfig[shift.visibility].label}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <CalendarFold className="size-4 shrink-0" />{' '}
                    {t('detail.statusLabel')}
                  </dt>
                  <dd className="ml-6">
                    {isFinished ? (
                      <Badge variant="secondary">{t('status.finished')}</Badge>
                    ) : (
                      <Badge variant="success">{t('status.active')}</Badge>
                    )}
                  </dd>
                </div>

                {shift.createdBy && (
                  <div>
                    <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                      <User className="size-4 shrink-0" />{' '}
                      {t('detail.createdByLabel')}
                    </dt>
                    <dd className="ml-6">
                      <UserCard user={shift.createdBy} size="sm" hideEmail />
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <Clock className="size-4 shrink-0" />{' '}
                    {t('detail.createdLabel')}
                  </dt>
                  <dd className="ml-6">
                    {formatDateTime(new Date(shift.createdAt))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
