import {
  type DataClient,
  DataError,
  JoinStatus,
  RequiredFormTargetType,
} from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftFormsClient } from '@/app/[locale]/(public)/shifts/[shiftId]/instances/[instanceId]/forms/shift-forms-client';
import type { RequiredFormItem } from '@/domain/requirement-form/components/required-form-renderer';
import { ShiftPageHeader } from '@/domain/shift/components/shift-page-header';
import { shiftPublicPath } from '@/domain/shift/share';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface ShiftFormsPageProps {
  params: Promise<{ locale: string; shiftId: string; instanceId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

type PublicShift = Awaited<ReturnType<DataClient['shift']['findById']>>;

export async function generateMetadata({ params }: ShiftFormsPageProps) {
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

export default async function ShiftFormsPage({
  params,
  searchParams,
}: ShiftFormsPageProps) {
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

  let instance: Awaited<ReturnType<DataClient['shift']['findPublicInstance']>>;
  try {
    instance = await data.shift.findPublicInstance(instanceId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const session = await getSession();
  if (!session) {
    const params = new URLSearchParams({
      redirectTo:
        redirectTo ?? `/shifts/${shiftId}/instances/${instanceId}/forms`,
    });
    redirect({ href: `/api/invite?${params}`, locale });
  }

  const joinResult = await data.shift
    .joinInstance(instanceId)
    .catch(() => null);

  if (joinResult?.status === JoinStatus.Joined) {
    redirect({
      href: getSafeRedirect(redirectTo, shiftPublicPath(shiftId, instanceId)),
      locale,
    });
  }

  const requiredForms: RequiredFormItem[] =
    joinResult?.requiredForms ??
    [
      ...(instance.requiredForms?.map((ref) => ({
        form: ref.form,
        order: ref.order,
        submitted: false,
        targetType: RequiredFormTargetType.ShiftInstance,
        targetId: instanceId,
      })) ?? []),
      ...(shift.requiredForms?.map((ref) => ({
        form: ref.form,
        order: ref.order,
        submitted: false,
        targetType: RequiredFormTargetType.Shift,
        targetId: shiftId,
      })) ?? []),
    ].sort((a, b) => a.order - b.order);

  const submittedFormIds = new Set<string>(
    requiredForms
      .filter((ref) => ref.submitted)
      .map((ref) => ref.form.id)
      .filter((id): id is string => Boolean(id)),
  );

  let profileData: Record<string, string> = {};
  try {
    const userProfile = await data.requirementForm.getMyUserProfile();
    profileData = (userProfile?.data ?? {}) as Record<string, string>;
  } catch {
    // Ignore profile fetch errors; form will render without prefilled values.
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ShiftPageHeader logoUrl={shift.organizationUnit?.logoUrl} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ShiftFormsClient
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
