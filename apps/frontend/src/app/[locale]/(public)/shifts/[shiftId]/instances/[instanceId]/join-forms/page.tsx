import {
  type DataClient,
  DataError,
  JoinStatus,
  RequiredFormTargetType,
} from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftJoinFormsClient } from '@/app/[locale]/(public)/shifts/[shiftId]/instances/[instanceId]/join-forms/shift-join-forms-client';
import type { RequiredFormItem } from '@/domain/requirement-form/components/required-form-renderer';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface ShiftJoinFormsPageProps {
  params: Promise<{ locale: string; shiftId: string; instanceId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

type PublicShift = Awaited<ReturnType<DataClient['shift']['findById']>>;

export async function generateMetadata({ params }: ShiftJoinFormsPageProps) {
  const { shiftId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  let shift: PublicShift;
  try {
    shift = await data.shift.findById(shiftId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    return { title: 'Shift — Caluno' };
  }
  const t = await getTranslations({ locale, namespace: 'ShiftDetail' });
  return {
    title: `${t('forms.title', { shiftTitle: shift.title })} — Caluno`,
  };
}

export default async function ShiftJoinFormsPage({
  params,
  searchParams,
}: ShiftJoinFormsPageProps) {
  const { locale, shiftId, instanceId } = await params;
  const { redirectTo } = await searchParams;

  const data = await getDataClient({ locale: resolveLocale(locale) });

  let shift: PublicShift;
  try {
    shift = await data.shift.findById(shiftId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const publicInstances =
    await data.shift.findPublicInstancesByShiftId(shiftId);
  const instance = publicInstances.find((i) => i.id === instanceId);

  if (!instance) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    const searchParams = new URLSearchParams({
      signup: '1',
      redirectTo:
        redirectTo ?? `/shifts/${shiftId}/instances/${instanceId}/join-forms`,
    });
    redirect({ href: `/api/invite?${searchParams}`, locale });
  }

  const membershipState =
    shift.organizationUnit?.myMembershipState ?? JoinStatus.None;
  if (membershipState === JoinStatus.Joined) {
    redirect({
      href: getSafeRedirect(redirectTo) ?? `/shifts/${shiftId}`,
      locale,
    });
  }

  const submissionsResult = await data.requirementForm
    .findMyFormSubmissions(shift.organizationUnitId)
    .catch(() => []);

  const submittedFormIds = new Set<string>(
    submissionsResult
      .filter((s) => s.status === 'SUBMITTED')
      .map((s) => s.form?.id)
      .filter((id): id is string => Boolean(id)),
  );

  const requiredForms: RequiredFormItem[] = [
    ...(instance.requiredForms?.map((ref) => ({
      form: ref.form,
      order: ref.order,
      submitted: submittedFormIds.has(ref.form.id),
      targetType: RequiredFormTargetType.ShiftInstance,
      targetId: instanceId,
    })) ?? []),
    ...(shift.requiredForms?.map((ref) => ({
      form: ref.form,
      order: ref.order,
      submitted: submittedFormIds.has(ref.form.id),
      targetType: RequiredFormTargetType.Shift,
      targetId: shiftId,
    })) ?? []),
    ...(shift.organizationUnit?.requiredForms?.map((ref) => ({
      form: ref.form,
      order: ref.order,
      submitted: submittedFormIds.has(ref.form.id),
      targetType: RequiredFormTargetType.OrganizationUnit,
      targetId: shift.organizationUnitId,
    })) ?? []),
  ].sort((a, b) => a.order - b.order);

  let profileData: Record<string, string> = {};
  try {
    const userProfile = await data.requirementForm.getMyUserProfile();
    if (
      userProfile?.data &&
      typeof userProfile.data === 'object' &&
      !Array.isArray(userProfile.data)
    ) {
      profileData = userProfile.data as Record<string, string>;
    }
  } catch {
    // Ignore profile fetch errors; form will render without prefilled values.
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <ShiftJoinFormsClient
          shiftId={shiftId}
          instanceId={instanceId}
          shiftTitle={shift.title}
          requiredForms={requiredForms}
          profileData={profileData}
          initialSubmittedFormIds={submittedFormIds}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
