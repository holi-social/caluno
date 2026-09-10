'use client';

import { MembershipRepository } from '@repo/data';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMemberships(orgUId: string) {
  const sdk = useSdk();
  const repository = new MembershipRepository(sdk);

  return useQuery({
    queryKey: ['memberships', orgUId],
    queryFn: () => repository.findAllByOrganizationUnitId(),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateMembershipRoles() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: ({
      membershipId,
      roleIds,
    }: {
      membershipId: string;
      roleIds: string[];
    }) => repository.updateRoles(membershipId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['memberships'],
      });
    },
  });
}

export function useLeaveMembership() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: (membershipId: string) => repository.leave(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['membershipRequests'] });
    },
  });
}

export function useRemoveMembership() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: (membershipId: string) => repository.remove(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

export function useSetMembershipIdVerified() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: ({
      membershipId,
      verified,
    }: {
      membershipId: string;
      verified: boolean;
    }) => repository.setIdVerified(membershipId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

/**
 * Check-in variant: the manual check-in page spans org units, so its
 * DataProvider carries no org unit header — the caller's selected unit must
 * be sent per request.
 */
export function useCheckInSetMembershipIdVerified(organizationUnitId: string) {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: ({
      membershipId,
      verified,
    }: {
      membershipId: string;
      verified: boolean;
    }) =>
      repository.checkInSetIdVerified(
        organizationUnitId,
        membershipId,
        verified,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['check-in-readiness'] });
    },
  });
}
