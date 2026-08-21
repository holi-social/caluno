jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => jest.fn(),
  Session: () => jest.fn(),
}));

import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import type { ShiftInstanceLoader } from './shift-instance.loader';
import { ShiftInstanceFieldResolver } from './shift-instance-field.resolver';

const instance = (
  overrides: Partial<ShiftInstanceEntity> = {},
): ShiftInstanceEntity =>
  ({ id: 'instance-1', ...overrides }) as ShiftInstanceEntity;

const newResolver = () =>
  new ShiftInstanceFieldResolver(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

describe('ShiftInstanceFieldResolver', () => {
  describe('myInvitedAt', () => {
    it('returns null without loading when there is no session user', async () => {
      const resolver = newResolver();
      const load = jest.fn();
      const loader = {
        myInvitedAtByKey: { load },
      } as unknown as ShiftInstanceLoader;

      const result = await resolver.myInvitedAt(
        instance({ id: 'instance-1' }),
        null as unknown as UserSession,
        loader,
      );

      expect(result).toBeNull();
      expect(load).not.toHaveBeenCalled();
    });

    it('loads the invited-at date keyed by instance and user', async () => {
      const resolver = newResolver();
      const createdAt = new Date('2026-08-12T10:00:00Z');
      const load = jest.fn().mockResolvedValue(createdAt);
      const loader = {
        myInvitedAtByKey: { load },
      } as unknown as ShiftInstanceLoader;
      const session = { user: { id: 'user-1' } } as UserSession;

      const result = await resolver.myInvitedAt(
        instance({ id: 'instance-1' }),
        session,
        loader,
      );

      expect(result).toEqual(createdAt);
      expect(load).toHaveBeenCalledWith('instance-1::user-1');
    });
  });
});
