'use client';

import { DataError, useCreateMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  orgUId: string;
}

export default function SendMembershipRequestButton({ orgUId }: Props) {
  const createMembershipRequest = useCreateMembershipRequest();

  const sendMembershipRequest = async () => {
    try {
      await createMembershipRequest.mutateAsync(orgUId);
      toast.success('Membership request sent successfully');
    } catch (error) {
      if (error instanceof DataError && error.options?.code === 'CONFLICT') {
        toast.error(
          'You have already requested membership for this organization',
        );
      } else {
        toast.error('Failed to send membership request.');
      }
      console.error(error);
    } finally {
      redirect('/');
    }
  };

  return <Button onClick={sendMembershipRequest}>Request Membership</Button>;
}
