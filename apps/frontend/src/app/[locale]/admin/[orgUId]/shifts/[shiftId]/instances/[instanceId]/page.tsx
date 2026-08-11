import { PermissionKey, ShiftVisibility } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftInstanceInformationCard } from '@/domain/shift/components/shift-instance-information-card';
import { ShiftInstanceMetaCard } from '@/domain/shift/components/shift-instance-meta-card';
import { ShiftInstanceVolunteersPanel } from '@/domain/shift/components/shift-instance-volunteers-panel';
import {
  parseShiftListQuery,
  shiftDetailPath,
} from '@/domain/shift/routes';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission } from '@/lib/permissions-server';
import ShareLinkButton from '../../../../../../../../domain/shift/components/share-link-button';

interface ShiftInstanceDetailPageProps {
  params: Promise<{ orgUId: string; shiftId: string; instanceId: string }>;
  searchParams: Promise<{
    view?: string;
    week?: string;
    page?: string;
  }>;
}

export default async function ShiftInstanceDetailPage({
  params,
  searchParams,
}: ShiftInstanceDetailPageProps) {
  const { orgUId, shiftId, instanceId } = await params;
  const returnQuery = parseShiftListQuery(await searchParams);
  await requireOrgAccess(orgUId);
  const [canManage = false] = await checkPermission(
    orgUId,
    PermissionKey.ShiftEdit,
  );

  const t = await getTranslations('Shift');
  const data = await getDataClient({ orgUId });
  const instance = await data.shift.findInstance(instanceId);
  const isInstanceInThePast =
    new Date(instance?.actualEndsAt ?? 0) < new Date();
  const isOpenShift =
    instance?.master.visibility === ShiftVisibility.AllMembers;

  if (!instance || instance.isCancelled) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title line-clamp-2">
            {instance.overrideTitle ?? instance.master.title}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('instanceDetail.subtitle')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={shiftDetailPath(orgUId, shiftId, returnQuery)}>
              <ArrowLeft />
              {t('instanceDetail.backToShift')}
            </Link>
          </Button>

          {isOpenShift && (
            <ShareLinkButton
              size="sm"
              shiftId={shiftId}
              instanceId={instanceId}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <ShiftInstanceInformationCard
            orgUId={orgUId}
            shiftId={shiftId}
            instanceId={instanceId}
            actualStartsAt={instance.actualStartsAt}
            actualEndsAt={instance.actualEndsAt}
            location={instance.overrideLocation ?? instance.master.location}
            instructions={
              instance.overrideInstructions ?? instance.master.instructions
            }
            rrule={instance.master.rrule}
            visibility={instance.master.visibility}
            canManage={canManage}
            isInstanceInThePast={isInstanceInThePast}
          />
        </div>
        <aside>
          <ShiftInstanceMetaCard
            actualEndsAt={instance.actualEndsAt}
            filledCount={instance.filledCount}
            maxVolunteers={
              instance.overrideMaxVolunteers ?? instance.master.maxVolunteers
            }
            createdAt={instance.master.createdAt}
            createdBy={instance.master.createdBy ?? null}
          />
        </aside>
      </div>

      <ShiftInstanceVolunteersPanel
        orgUId={orgUId}
        shiftId={shiftId}
        instanceId={instanceId}
        invites={instance.invites ?? []}
        spotsLeft={instance.spotsLeft}
        canManage={canManage}
      />
    </div>
  );
}
