import { JoinStatus } from '@repo/data';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { redirect as redirectWithLocale } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { JoinFormsClient, type RequiredFormItem } from './join-forms-client';

interface JoinFormsPageProps {
  params: Promise<{ locale: string; orgUId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function JoinFormsPage({
  params,
  searchParams,
}: JoinFormsPageProps) {
  const { locale, orgUId } = await params;
  const { redirectTo } = await searchParams;
  const _t = await getTranslations('MembershipRequest');

  const session = await getSession();
  if (!session) {
    const searchParams = new URLSearchParams({
      orgUId,
      redirectTo: redirectTo ?? `/join/${orgUId}/forms`,
    });
    redirectWithLocale({ href: `/api/invite?${searchParams}`, locale });
  }

  const data = await getDataClient();

  const [orgUnit, userProfile, submissionsResult, joinResult] =
    await Promise.all([
      data.organizationUnit.findById(orgUId),
      data.requirementForm.getMyUserProfile(),
      data.requirementForm.findMyFormSubmissions(orgUId),
      data.membershipRequest.join(orgUId).catch(() => null),
    ]);

  if (!orgUnit) {
    redirect('/');
  }

  if (joinResult?.status === JoinStatus.Joined) {
    redirect(getSafeRedirect(redirectTo) ?? `/admin/${orgUId}`);
  }

  const profileData =
    userProfile?.data &&
    typeof userProfile.data === 'object' &&
    !Array.isArray(userProfile.data)
      ? (userProfile.data as Record<string, string>)
      : {};

  const submittedFormIds = new Set<string>(
    submissionsResult
      .filter((s) => s.status === 'SUBMITTED')
      .map((s) => s.form?.id)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <JoinFormsClient
          orgUId={orgUId}
          orgName={orgUnit.name}
          requiredForms={orgUnit.requiredForms as RequiredFormItem[]}
          profileData={profileData}
          initialSubmittedFormIds={submittedFormIds}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
