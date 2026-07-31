import { type DataClient, DataError, JoinStatus } from '@repo/data';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShiftFormsClient } from '@/app/[locale]/(public)/shifts/[shiftId]/forms/shift-forms-client';
import type { RequiredFormItem } from '@/domain/requirement-form/components/required-form-renderer';
import { redirect as redirectWithLocale } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface ShiftFormsPageProps {
  params: Promise<{ locale: string; shiftId: string }>;
  searchParams: Promise<{ instanceId?: string; redirectTo?: string }>;
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
    return { title: 'Shift — Clippy' };
  }
  const t = await getTranslations({ locale, namespace: 'ShiftDetail' });
  return {
    title: `${t('forms.title', { shiftTitle: shift.title })} — Clippy`,
  };
}

export default async function ShiftFormsPage({
  params,
  searchParams,
}: ShiftFormsPageProps) {
  const { locale, shiftId } = await params;
  const { instanceId, redirectTo } = await searchParams;

  if (!instanceId) {
    notFound();
  }

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

  const session = await getSession();
  if (!session) {
    const params = new URLSearchParams({
      redirectTo:
        redirectTo ?? `/shifts/${shiftId}/forms?instanceId=${instanceId}`,
    });
    redirectWithLocale({ href: `/api/invite?${params}`, locale });
  }

  const joinResult = await data.shift
    .joinInstance(instanceId)
    .catch(() => null);

  if (joinResult?.status === JoinStatus.Joined) {
    redirect(getSafeRedirect(redirectTo) ?? `/shifts/${shiftId}`);
  }

  const requiredForms =
    joinResult?.requiredForms ??
    shift.requiredForms?.map((ref) => ({ ...ref, submitted: false })) ??
    [];

  const submittedFormIds = new Set<string>(
    requiredForms
      .filter((ref) => ref.submitted)
      .map((ref) => ref.form.id)
      .filter((id): id is string => Boolean(id)),
  );

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
        <ShiftFormsClient
          shiftId={shiftId}
          instanceId={instanceId}
          shiftTitle={shift.title}
          requiredForms={requiredForms as RequiredFormItem[]}
          profileData={profileData}
          initialSubmittedFormIds={submittedFormIds}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
