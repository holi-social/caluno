import { notFound, redirect } from 'next/navigation';
import { VolunteerFormWrapper } from '@/domain/requirement-form/components/volunteer-form-wrapper';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { validateUserOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicFormPage({ params }: Props) {
  const { token } = await params;
  const data = await getDataClient();

  const form = await data.requirementForm.findFormByShareToken(token);
  if (!form) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    const orgUId = form.organizationUnitId;
    if (orgUId) {
      redirect(
        `/api/invite?orgUId=${orgUId}&redirectTo=${encodeURIComponent(`/f/${token}`)}`,
      );
    }
    redirect(`/login?redirectTo=${encodeURIComponent(`/f/${token}`)}`);
  }

  const [isMember, userProfile, orgUnit] = await Promise.all([
    form.organizationUnitId
      ? validateUserOrgAccess(form.organizationUnitId)
      : Promise.resolve(false),
    data.requirementForm.getMyUserProfile(),
    form.organizationUnitId
      ? data.organizationUnit.findById(form.organizationUnitId)
      : Promise.resolve(null),
  ]);

  let profileData: Record<string, string> = {};
  if (userProfile?.data) {
    try {
      const parsed = JSON.parse(userProfile.data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        profileData = parsed as Record<string, string>;
      }
    } catch {
      // ignore malformed profile data
    }
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
