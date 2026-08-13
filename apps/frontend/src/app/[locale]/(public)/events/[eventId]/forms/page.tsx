import { type DataClient, DataError, JoinStatus } from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EventFormsClient } from '@/app/[locale]/(public)/events/[eventId]/forms/event-forms-client';
import { EventPageHeader } from '@/domain/event/components/event-page-header';
import type { RequiredFormItem } from '@/domain/requirement-form/components/required-form-renderer';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface EventFormsPageProps {
  params: Promise<{ locale: string; eventId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

type PublicEvent = Awaited<ReturnType<DataClient['publicEvent']['findById']>>;

export async function generateMetadata({ params }: EventFormsPageProps) {
  const { eventId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  let event: PublicEvent;
  try {
    event = await data.publicEvent.findById(eventId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    return { title: 'Event — Caluno' };
  }
  const t = await getTranslations({ locale, namespace: 'EventDetail' });
  return { title: `${t('forms.title', { eventTitle: event.title })} — Caluno` };
}

export default async function EventFormsPage({
  params,
  searchParams,
}: EventFormsPageProps) {
  const { locale, eventId } = await params;
  const { redirectTo } = await searchParams;
  const data = await getDataClient({ locale: resolveLocale(locale) });

  let event: PublicEvent;
  try {
    event = await data.publicEvent.findById(eventId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const session = await getSession();
  if (!session) {
    const searchParams = new URLSearchParams({
      redirectTo: redirectTo ?? `/events/${eventId}/forms`,
    });
    redirect({ href: `/api/invite?${searchParams}`, locale });
  }

  const joinResult = await data.publicEvent.join(eventId).catch(() => null);

  if (joinResult?.status === JoinStatus.Joined) {
    redirect({
      href: getSafeRedirect(redirectTo) ?? `/events/${eventId}`,
      locale,
    });
  }

  const requiredForms =
    joinResult?.requiredForms ??
    event.requiredForms?.map((ref) => ({ ...ref, submitted: false })) ??
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
    <div className="min-h-screen bg-muted/30">
      <EventPageHeader logoUrl={event.organizationUnit?.logoUrl} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EventFormsClient
          eventId={eventId}
          eventTitle={event.title}
          requiredForms={requiredForms as RequiredFormItem[]}
          profileData={profileData}
          initialSubmittedFormIds={submittedFormIds}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
