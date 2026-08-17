import { PermissionKey, ShiftVisibility } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  DetailCoverImage,
  DetailCoverImagePlaceholder,
} from '@/components/detail-entity-image';
import { DeleteShiftInstanceDialog } from '@/domain/shift/components/delete-shift-instance-dialog';
import ShareLinkButton from '@/domain/shift/components/share-link-button';
import { ShiftInstanceInformationCard } from '@/domain/shift/components/shift-instance-information-card';
import { ShiftInstanceMetaCard } from '@/domain/shift/components/shift-instance-meta-card';
import { ShiftInstanceRequiredFormsPopover } from '@/domain/shift/components/shift-instance-required-forms-popover';
import { ShiftInstanceVolunteersPanel } from '@/domain/shift/components/shift-instance-volunteers-panel';
import {
  parseShiftListQuery,
  shiftDetailPath,
  shiftInstanceEditPath,
} from '@/domain/shift/routes';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission } from '@/lib/permissions-server';

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
  const isRecurring = Boolean(instance?.master.rrule);

  if (!instance || instance.isCancelled) {
    notFound();
  }

  const title = instance.overrideTitle ?? instance.master.title;
  const imageUrl = instance.master.imageUrl;
  const canAddImage = canManage && !isInstanceInThePast;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title line-clamp-2">{title}</h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={shiftDetailPath(orgUId, shiftId, returnQuery)}>
              <ArrowLeft />
              {t('instanceDetail.backToShift')}
            </Link>
          </Button>

          <ShiftInstanceRequiredFormsPopover
            orgUId={orgUId}
            instanceId={instanceId}
          />
          {isOpenShift && (
            <ShareLinkButton
              size="sm"
              shiftId={shiftId}
              instanceId={instanceId}
              label={t('instanceDetail.inviteLink')}
            />
          )}

          {canManage ? (
            <DeleteShiftInstanceDialog
              orgUId={orgUId}
              instanceId={instanceId}
              isRecurring={isRecurring}
              instanceDate={new Date(instance.actualStartsAt)}
              trigger={
                <Button
                  variant="destructive"
                  size="icon-sm"
                  tooltip={t('instanceDetail.deleteAria')}
                  disabled={isInstanceInThePast}
                >
                  <Trash2 />
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      {imageUrl ? (
        <DetailCoverImage
          src={imageUrl}
          alt={t('detail.imageAlt', { title })}
        />
      ) : canManage ? (
        canAddImage ? (
          <Link
            href={shiftInstanceEditPath(orgUId, shiftId, instanceId)}
            className="block rounded-xl outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <DetailCoverImagePlaceholder
              label={t('instanceDetail.imagePlaceholder')}
              className="transition-colors hover:bg-muted/70 hover:text-foreground"
            />
          </Link>
        ) : (
          <DetailCoverImagePlaceholder
            label={t('instanceDetail.imagePlaceholder')}
          />
        )
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 h-full">
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
            filledCount={instance.filledCount}
            maxVolunteers={
              instance.overrideMaxVolunteers ?? instance.master.maxVolunteers
            }
            canManage={canManage}
            isInstanceInThePast={isInstanceInThePast}
          />
        </div>
        <aside className="h-full">
          <ShiftInstanceMetaCard
            actualEndsAt={instance.actualEndsAt}
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
