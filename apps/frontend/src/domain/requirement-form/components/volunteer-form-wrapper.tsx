import { type PublicForm, VolunteerForm } from './volunteer-form';

export function VolunteerFormWrapper({
  form,
  token,
  isMember,
  orgName,
  profileData,
}: {
  form: PublicForm;
  token: string;
  isMember: boolean;
  orgUId: string;
  orgName?: string;
  profileData?: Record<string, string>;
}) {
  return (
    <VolunteerForm
      form={form}
      token={token}
      isMember={isMember}
      orgName={orgName}
      profileData={profileData}
    />
  );
}
