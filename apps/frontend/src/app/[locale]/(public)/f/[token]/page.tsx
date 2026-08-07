import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { VolunteerFormWrapper } from '@/domain/requirement-form/components/volunteer-form-wrapper';
import { redirect as redirectWithLocale } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { isMember as isMemberOfOrgUnit } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ locale: string; token: string }>;
}

export default async function PublicFormPage({ params }: Props) {
  const { locale, token } = await params;
  const data = await getDataClient();

  const form = await data.requirementForm.findFormByShareToken(token);
  if (!form) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    const orgUId = form.organizationUnitId;
    if (orgUId) {
      redirectWithLocale({
        href: `/api/invite?orgUId=${orgUId}&redirectTo=${encodeURIComponent(`/f/${token}`)}`,
        locale,
      });
    }
    redirectWithLocale({
      href: `/signup?redirectTo=${encodeURIComponent(`/f/${token}`)}`,
      locale,
    });
  }

  const [isMember, userProfile, orgUnit, existingSubmission] =
    await Promise.all([
      form.organizationUnitId
        ? isMemberOfOrgUnit(form.organizationUnitId)
        : Promise.resolve(false),
      data.requirementForm.getMyUserProfile(),
      form.organizationUnitId
        ? data.organizationUnit.findById(form.organizationUnitId)
        : Promise.resolve(null),
      data.requirementForm.getMyFormSubmissionByToken(token),
    ]);

  let profileData: Record<string, string> = {};
  const raw = userProfile?.data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    profileData = raw as Record<string, string>;
  }

  const t = await getTranslations('RequirementForm.volunteerForm');

  if (existingSubmission && existingSubmission.status !== 'REJECTED') {
    return (
      <div className="min-h-screen bg-muted/30 py-10 px-4">
        <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">
            {t('alreadySubmittedTitle')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t('alreadySubmittedMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-xl">
        <VolunteerFormWrapper
          form={form}
          token={token}
          isMember={isMember}
          orgUId={form.organizationUnitId ?? ''}
          orgName={orgUnit?.name}
          profileData={profileData}
        />
      </div>
    </div>
  );
}
