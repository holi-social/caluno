'use client';

import {
  useOrgUId,
  useQueryClient,
  useShiftVolunteers,
  useVolunteers,
} from '@repo/data/react';
import { Button, Field } from '@repo/ui';
import { useState } from 'react';
import { toast } from 'sonner';
import { MemberSelect } from '@/components/member-select';
import { useSession } from '@/lib/auth';
import { inviteShiftVolunteers } from '../actions';
import { shiftShareUrl } from '../share';

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
  const [isInviting, setIsInviting] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const orgUId = useOrgUId();
  const session = useSession();
  const queryClient = useQueryClient();

  const { data: shiftVolunteers } = useShiftVolunteers(shiftId);
  const { data: volunteers } = useVolunteers(orgUId);
  const currentUserId = session.data?.user?.id;

  const existingIds = new Set(shiftVolunteers?.map((v) => v.id) ?? []);
  const readonlyIds = shiftVolunteers?.map((v) => v.id) ?? [];

  const eligibleVolunteers = volunteers?.filter((v) => v.id !== currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newMemberIds = memberIds.filter((id) => !existingIds.has(id));
    if (newMemberIds.length === 0) {
      toast.info('No new volunteers selected');
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteShiftVolunteers({
        shiftId,
        organizationUnitId: orgUId,
        memberIds: newMemberIds,
      });

      if (result?.serverError) {
        setServerError(result.serverError);
        toast.error(result.serverError);
        return;
      }

      toast.success('Volunteers invited successfully');
      setMemberIds([]);
      queryClient.invalidateQueries({
        queryKey: ['shiftVolunteers', shiftId],
      });
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to invite volunteers';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
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
          members={eligibleVolunteers}
          value={memberIds}
          onChange={setMemberIds}
          readonlyIds={readonlyIds}
          inviteLinkUrl={shiftShareUrl(shiftId)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isInviting || memberIds.length === 0}>
          {isInviting ? 'Inviting...' : 'Invite volunteers'}
        </Button>
      </div>
    </form>
  );
}
