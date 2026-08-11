import { PermissionKey, ShiftVisibility } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftInstanceRequiredFormsPopover } from '@/domain/shift/components/shift-instance-required-forms-popover';
import { ShiftInstanceVolunteersPanel } from '@/domain/shift/components/shift-instance-volunteers-panel';
import {
  parseShiftListQuery,
  shiftDetailPath,
  shiftInstanceEditPath,
  shiftInvitePath,
} from '@/domain/shift/routes';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
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
  const { formatRange } = await getFormatting();
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
          <p className="mt-2 text-sm text-muted-foreground">
            {formatRange(
              new Date(instance.actualStartsAt),
              new Date(instance.actualEndsAt),
            )}
          </p>
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
            />
          )}

          {canManage ? (
            isInstanceInThePast ? (
              <Button variant="outline" size="sm" disabled>
                {t('instanceDetail.editCta')}
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={shiftInstanceEditPath(orgUId, shiftId, instanceId)}>
                  {t('instanceDetail.editCta')}
                </Link>
              </Button>
            )
          ) : null}

          {canManage ? (
            <Button asChild size="sm">
              <Link href={shiftInvitePath(orgUId, shiftId, instanceId)}>
                <UserPlus />
                {t('instanceDetail.inviteCta')}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <ShiftInstanceVolunteersPanel
        orgUId={orgUId}
        instanceId={instanceId}
        invites={instance.invites ?? []}
        spotsLeft={instance.spotsLeft}
        canManage={canManage}
      />
    </div>
  );
}
