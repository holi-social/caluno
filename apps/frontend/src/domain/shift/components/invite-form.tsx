'use client';

import { useOrgUId, useVolunteers } from '@repo/data/react';
import { Button, Field } from '@repo/ui';
import { useState, useTransition } from 'react';
import { MemberSelect } from '@/components/member-select';
import { inviteShiftVolunteers } from '../actions';

interface InviteShiftFormProps {
  shiftId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteShiftForm({
  shiftId,
  onSuccess,
  onCancel,
}: InviteShiftFormProps) {
  const [isPending, startTransition] = useTransition();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const orgUId = useOrgUId();

  const { data: volunteers } = useVolunteers(orgUId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      const result = await inviteShiftVolunteers({
        shiftId,
        organizationUnitId: orgUId,
        memberIds,
      });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Field>
        <MemberSelect
          members={volunteers}
          value={memberIds}
          onChange={setMemberIds}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Inviting...' : 'Invite volunteers'}
        </Button>
      </div>
    </form>
  );
}
