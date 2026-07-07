import { Badge, Card, CardContent } from '@repo/ui';
import {
  Calendar,
  CalendarFold,
  Clock,
  FileText,
  LockKeyholeOpen,
  MapPin,
  UsersRound,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftInstanceVolunteersSection } from '@/domain/shift/components/shift-instance-volunteers-section';
import { getVisibilityConfig } from '@/domain/shift/components/shifts-table';
import { parseShiftListQuery } from '@/domain/shift/routes';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { requireOrgAccess } from '@/lib/org-context-server';
import { ShiftInstanceViewActionBar } from './shift-instance-view-action-bar';

interface ShiftInstanceViewPageProps {
  params: Promise<{ orgUId: string; shiftId: string; instanceId: string }>;
  searchParams: Promise<{
    view?: string;
    week?: string;
    page?: string;
  }>;
}

export default async function ShiftInstanceViewPage({
  params,
  searchParams,
}: ShiftInstanceViewPageProps) {
  const { orgUId, shiftId, instanceId } = await params;
  const returnQuery = parseShiftListQuery(await searchParams);

  await requireOrgAccess(orgUId);

  const t = await getTranslations('ShiftInstanceDetail');
  const tShift = await getTranslations('Shift');
  const data = await getDataClient({ orgUId });
  const { formatDate, formatTimeRange } = await getFormatting();
  const visibilityConfig = getVisibilityConfig(tShift);

  const [shift, instances, volunteers] = await Promise.all([
    data.shift.findById(shiftId),
    data.shift.findInstances(shiftId),
    data.shift.findVolunteersByInstanceId(instanceId),
  ]);

  const instance = instances.find((item) => item.id === instanceId);

  if (!shift || !instance) {
    notFound();
  }

  const title = instance.overrideTitle ?? shift.title;
  const location =
    (instance.overrideLocation ?? shift.location)?.trim() || null;
  const instructions =
    (instance.overrideInstructions ?? shift.instructions)?.trim() || null;
  const maxVolunteers = shift.maxVolunteers;

  const startsAt = new Date(instance.actualStartsAt);
  const endsAt = new Date(instance.actualEndsAt);
  const now = new Date();
  const isFinished = now > endsAt;
  const isCancelled = instance.isCancelled;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title line-clamp-2">{title}</h1>
        </div>
        <div className="shrink-0">
          <ShiftInstanceViewActionBar
            shiftId={shiftId}
            instanceId={instanceId}
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
                  <span>{formatDate(startsAt)}</span>
                </li>
                <li className="flex gap-2">
                  <Clock className="text-muted-foreground shrink-0" />
                  <span>{formatTimeRange(startsAt, endsAt)}</span>
                </li>
                <li className="flex gap-2">
                  <MapPin className="text-muted-foreground shrink-0" />
                  <span
                    className={
                      location ? undefined : 'text-muted-foreground italic'
                    }
                  >
                    {location ?? t('detail.emptyLocation')}
                  </span>
                </li>
                <li className="flex gap-2">
                  <FileText className="text-muted-foreground shrink-0" />
                  <p
                    className={`whitespace-pre-wrap break-words min-w-0 ${
                      instructions ? '' : 'text-muted-foreground italic'
                    }`}
                  >
                    {instructions ?? t('detail.emptyInstructions')}
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <ShiftInstanceVolunteersSection
            shiftId={shiftId}
            instanceId={instanceId}
            volunteers={volunteers}
            canManage
            isCancelled={isCancelled}
          />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <LockKeyholeOpen className="size-4 shrink-0" />
                    {tShift('detail.visibilityLabel')}
                  </dt>
                  <dd className="ml-6">
                    <Badge variant={visibilityConfig[shift.visibility].variant}>
                      {visibilityConfig[shift.visibility].label}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <CalendarFold className="size-4 shrink-0" />
                    {tShift('detail.statusLabel')}
                  </dt>
                  <dd className="ml-6">
                    {isCancelled ? (
                      <Badge variant="destructive">{t('status.cancelled')}</Badge>
                    ) : isFinished ? (
                      <Badge variant="secondary">{tShift('status.finished')}</Badge>
                    ) : (
                      <Badge variant="success">{tShift('status.active')}</Badge>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <UsersRound className="size-4 shrink-0" />
                    {t('volunteers.heading')}
                  </dt>
                  <dd className="ml-6">
                    {maxVolunteers != null
                      ? t('detail.staffingCount', {
                          count: volunteers.length,
                          max: maxVolunteers,
                        })
                      : volunteers.length}
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
