'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MembershipRequestRepository } from '../../repositories/membershipRequest/membershipRequest.repository';
import { ShiftRepository } from '../../repositories/shift/shift.repository';
import { TimeEntryRepository } from '../../repositories/time-entry/time-entry.repository';
import { useSdk } from './use-graphql-client';

/**
 * Deliberately no query invalidation: per the spec, invite mutations leave
 * readiness state unchanged for this session (the volunteer must accept
 * elsewhere) — the caller settles the button into a "sent" confirmation via
 * local component state instead of re-arming from a refetch.
 */
export function useCheckInInviteToOrganization(organizationUnitId: string) {
  const sdk = useSdk();
  const repository = new TimeEntryRepository(sdk);

  return useMutation({
    mutationFn: (volunteerId: string) =>
      repository.checkInInviteToOrganization(organizationUnitId, volunteerId),
  });
}

export function useCheckInInviteToShiftInstance(organizationUnitId: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: ({
      shiftInstanceId,
      volunteerId,
    }: {
      shiftInstanceId: string;
      volunteerId: string;
    }) =>
      repository.checkInInviteToShiftInstance(
        organizationUnitId,
        shiftInstanceId,
        volunteerId,
      ),
  });
}

export function useCheckInApproveMembershipRequest(organizationUnitId: string) {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(sdk);

  return useMutation({
    mutationFn: (requestId: string) =>
      repository.checkInApprove(requestId, organizationUnitId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['check-in-readiness', organizationUnitId],
      });
    },
  });
}
