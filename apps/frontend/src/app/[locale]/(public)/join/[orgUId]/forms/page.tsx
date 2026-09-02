import { JoinStatus } from '@repo/data';
import { getTranslations } from 'next-intl/server';
import { OrgPageHeader } from '@/domain/org-unit/components/org-page-header';
import { buildSubmittedFormIds } from '@/domain/requirement-form/resolve-required-forms';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { JoinFormsClient } from './join-forms-client';

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
    redirect({ href: `/api/invite?${searchParams}`, locale });
  }

  const data = await getDataClient();

  const [orgUnit, userProfile, joinResult] = await Promise.all([
    data.organizationUnit.findById(orgUId),
    data.requirementForm.getMyUserProfile(),
    data.membershipRequest.join(orgUId).catch(() => null),
  ]);

  if (!orgUnit) {
    redirect({ href: '/', locale });
    return;
  }

  if (joinResult?.status === JoinStatus.Joined) {
    redirect({
      href: getSafeRedirect(redirectTo, `/admin/${orgUId}`),
      locale,
    });
  }

  const mySubmissions =
    await data.requirementForm.findMyFormSubmissions(orgUId);

  const profileData = (userProfile?.data ?? {}) as Record<string, string>;

  const submittedFormIds = buildSubmittedFormIds(mySubmissions);

  return (
    <div className="min-h-screen bg-muted/30">
      <OrgPageHeader logoUrl={orgUnit.logoUrl} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <JoinFormsClient
          orgUId={orgUId}
          orgName={orgUnit.name}
          requiredForms={orgUnit.requiredForms}
          profileData={profileData}
          initialSubmittedFormIds={submittedFormIds}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
