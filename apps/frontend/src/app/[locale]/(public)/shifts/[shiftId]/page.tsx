import {
  JoinStatus,
  type PublicShiftInstance,
  type RawShift,
} from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DetailHero } from '@/components/detail-hero';
import { ShiftDetailContent } from '@/domain/shift/components/shift-detail-content';
import { ShiftPageHeader } from '@/domain/shift/components/shift-page-header';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { isAuthenticated } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface ShiftPageProps {
  params: Promise<{ shiftId: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: ShiftPageProps) {
  const { shiftId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  let shift: RawShift | undefined;
  try {
    shift = await data.shift.findById(shiftId);
  } catch {
    return { title: 'Shift — Caluno' };
  }
  return { title: `${shift.title} — Caluno` };
}

export default async function ShiftPage({
  params,
  searchParams,
}: ShiftPageProps) {
  const { shiftId, locale } = await params;
  const search = await searchParams;
  const autoJoin = search.autoJoin === 'true';
  const instanceId =
    typeof search.instanceId === 'string' ? search.instanceId : undefined;

  const data = await getDataClient({ locale: resolveLocale(locale) });

  let shift: RawShift | undefined;
  let instances: PublicShiftInstance[];
  try {
    [shift, instances] = await Promise.all([
      data.shift.findById(shiftId),
      data.shift.findPublicInstancesByShiftId(shiftId),
    ]);
  } catch {
    notFound();
  }

  if (!shift) {
    notFound();
  }

  const t = await getTranslations('ShiftDetail');
  const authenticated = await isAuthenticated();

  const showJoinForms = search.showJoinForms === 'true';
  const membershipState =
    shift.organizationUnit?.myMembershipState ?? JoinStatus.None;
  const hasShiftForms = (shift.requiredForms?.length ?? 0) > 0;
  const hasOrgUnitForms =
    (shift.organizationUnit?.requiredForms?.length ?? 0) > 0;

  if (
    showJoinForms &&
    authenticated &&
    membershipState === JoinStatus.None &&
    hasShiftForms &&
    hasOrgUnitForms &&
    instanceId
  ) {
    redirect({
      href: `/shifts/${shiftId}/instances/${instanceId}/join-forms?redirectTo=/`,
      locale,
    });
  }

  const coverImageUrl = shift.imageUrl ?? shift.event?.coverImageUrl ?? null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-x-0 top-0 z-10">
        <ShiftPageHeader logoUrl={shift.organizationUnit?.logoUrl} />
      </div>

      <DetailHero
        title={shift.title}
        coverImageUrl={coverImageUrl}
        coverImageAlt={t('coverImageAlt', { title: shift.title })}
        badge={
          shift.event
            ? {
                label: t('eventBadge', { eventTitle: shift.event.title }),
                href: `/events/${shift.event.id}`,
              }
            : null
        }
        org={
          shift.organizationUnit
            ? {
                name: shift.organizationUnit.name,
                href: `/orgs/${shift.organizationUnit.id}`,
              }
            : null
        }
      />

      <ShiftDetailContent
        shift={shift}
        instances={instances}
        isAuthenticated={authenticated}
        autoJoin={autoJoin}
        preselectedInstanceId={instanceId}
      />
    </div>
  );
}
