'use client';

import { EventRepository, PublicEventRepository } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEventInput,
  UpdateEventInput,
} from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export function useEvents() {
  const sdk = useSdk();
  const repository = new EventRepository(sdk);

  return useQuery({
    queryKey: ['events'],
    queryFn: () => repository.findAll(),
    staleTime: 30 * 1000,
  });
}

export function useEvent(id: string) {
  const sdk = useSdk();
  const repository = new EventRepository(sdk);

  return useQuery({
    queryKey: ['event', id],
    queryFn: () => repository.findById(id),
    staleTime: 30 * 1000,
  });
}

export function useCreateEvent() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: (input: CreateEventInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      repository.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
}

export function useDeleteEvent() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useInviteMembersToEvent() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: ({
      eventId,
      memberIds,
    }: {
      eventId: string;
      memberIds: string[];
    }) => repository.inviteMembers(eventId, memberIds),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['eventInvites', eventId] });
    },
  });
}

export function useSetEventRequiredForms() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: ({
      eventId,
      formIds,
    }: {
      eventId: string;
      formIds: string[];
    }) => repository.setRequiredForms(eventId, formIds),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['publicEvent', eventId] });
    },
  });
}

export function usePublicEvent(id: string) {
  const sdk = useSdk();
  const repository = new PublicEventRepository(sdk);

  return useQuery({
    queryKey: ['publicEvent', id],
    queryFn: () => repository.findById(id),
    staleTime: 30 * 1000,
  });
}

export function useJoinEvent() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new PublicEventRepository(sdk);

  return useMutation({
    mutationFn: (eventId: string) => repository.join(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['publicEvent', eventId] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
  });
}
