import { type PublicForm, VolunteerForm } from './volunteer-form';

export function VolunteerFormWrapper({
  form,
  token,
  isMember,
  profileData,
}: {
  form: PublicForm;
  token: string;
  isMember: boolean;
  orgUId: string;
  profileData?: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      {!isMember && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
          By submitting this form you will send a membership request to{' '}
          <strong>{form.name}</strong>. An admin will review and approve your
          request.
        </div>
      )}
      <VolunteerForm
        form={form}
        token={token}
        isMember={isMember}
        profileData={profileData}
      />
    </div>
  );
}
