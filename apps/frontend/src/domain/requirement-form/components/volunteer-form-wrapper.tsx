'use client';

import type { RequirementForm } from '@repo/data';
import { Button } from '@repo/ui';
import { useState } from 'react';
import { toast } from 'sonner';
import { joinOrganization } from '../actions';
import { VolunteerForm } from './volunteer-form';

export function VolunteerFormWrapper({
  form,
  token,
  isMember,
  orgUId,
}: {
  form: RequirementForm;
  token: string;
  isMember: boolean;
  orgUId: string;
}) {
  const [joined, setJoined] = useState(isMember);
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<string | null>(null);

  async function handleJoin() {
    setJoining(true);
    try {
      const result = await joinOrganization({ organizationUnitId: orgUId });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        const status = result.data.status;
        if (status === 'JOINED') {
          setJoined(true);
          toast.success('You have joined the organization');
        } else if (status === 'PENDING') {
          setJoined(true);
          setJoinResult(
            'Your membership request is pending approval. You can still fill in the form.',
          );
        } else if (status === 'REQUIREMENTS_NEEDED') {
          setJoined(true);
          setJoinResult(
            'Please complete the requirements. You can still fill in the form.',
          );
        } else if (status === 'REJECTED') {
          setJoinResult('Your membership request was rejected.');
        }
      } else {
        toast.error('Failed to join organization');
      }
    } catch {
      toast.error('Failed to join organization');
    } finally {
      setJoining(false);
    }
  }

  if (!joined) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Join to continue</h2>
        <p className="text-muted-foreground mt-2">
          You need to join <strong>{form.name}</strong>&apos;s organization to
          fill in this form.
        </p>
        <Button
          className="mt-6"
          size="lg"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? 'Joining...' : 'Join Organization'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {joinResult && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
          {joinResult}
        </div>
      )}
      <VolunteerForm form={form} token={token} />
    </div>
  );
}
