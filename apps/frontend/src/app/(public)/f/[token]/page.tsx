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

  const isMember = form.organizationUnitId
    ? await validateUserOrgAccess(form.organizationUnitId)
    : false;

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-xl">
        <VolunteerFormWrapper
          form={form}
          token={token}
          isMember={isMember}
          orgUId={form.organizationUnitId ?? ''}
        />
      </div>
    </div>
  );
}
