jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => jest.fn(),
  Session: () => jest.fn(),
}));

import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { EventEntity } from '../schemas/event.schema';
import { EventFieldResolver } from './event-field.resolver';
import type { EventInviteLoader } from './event-invite.loader';

const event = (overrides: Partial<EventEntity> = {}): EventEntity =>
  ({ id: 'event-1', organizationUnitId: 'org-1', ...overrides }) as EventEntity;

const newResolver = () =>
  new EventFieldResolver({} as never, {} as never, {} as never);

describe('EventFieldResolver', () => {
  describe('myInvitedAt', () => {
    it('returns null without loading when there is no session user', async () => {
      const resolver = newResolver();
      const load = jest.fn();
      const loader = {
        inviteByEventIdAndUserId: { load },
      } as unknown as EventInviteLoader;

      const result = await resolver.myInvitedAt(
        event({ id: 'event-1' }),
        null as unknown as UserSession,
        loader,
      );

      expect(result).toBeNull();
      expect(load).not.toHaveBeenCalled();
    });

    it('returns null when the user has no invite for the event', async () => {
      const resolver = newResolver();
      const load = jest.fn().mockResolvedValue(null);
      const loader = {
        inviteByEventIdAndUserId: { load },
      } as unknown as EventInviteLoader;
      const session = { user: { id: 'user-1' } } as UserSession;

      const result = await resolver.myInvitedAt(
        event({ id: 'event-1' }),
        session,
        loader,
      );

      expect(result).toBeNull();
      expect(load).toHaveBeenCalledWith('event-1:user-1');
    });

    it('returns the invite createdAt for an invited user', async () => {
      const resolver = newResolver();
      const createdAt = new Date('2026-08-12T10:00:00Z');
      const load = jest.fn().mockResolvedValue({ createdAt });
      const loader = {
        inviteByEventIdAndUserId: { load },
      } as unknown as EventInviteLoader;
      const session = { user: { id: 'user-1' } } as UserSession;

      const result = await resolver.myInvitedAt(
        event({ id: 'event-1' }),
        session,
        loader,
      );

      expect(result).toEqual(createdAt);
    });
  });
});
