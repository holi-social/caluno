jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { ShiftInviteStatus } from '../enums';
import type { ShiftInstanceInviteEntity } from '../schemas/shift-instance-invite.schema';
import type { ShiftService } from '../shift.service';
import { ShiftInstanceInvitesLoader } from './loader';

const now = new Date('2026-06-24T09:00:00Z');
const organizationUnitId = 'unit-1';

const invite = (
  overrides: Partial<ShiftInstanceInviteEntity>,
): ShiftInstanceInviteEntity => ({
  id: 'invite-1',
  instanceId: 'instance-1',
  userId: 'user-1',
  status: ShiftInviteStatus.INVITED,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('ShiftInstanceInvitesLoader', () => {
  let findInvites: jest.Mock;
  let loader: ShiftInstanceInvitesLoader;

  beforeEach(() => {
    findInvites = jest.fn();
    loader = new ShiftInstanceInvitesLoader({
      findInvites,
    } as unknown as ShiftService);
  });

  describe('invitesByInstanceId', () => {
    it('returns the invite for a matching instance and user', async () => {
      const row = invite({
        id: 'invite-1',
        instanceId: 'instance-1',
        userId: 'user-1',
      });
      findInvites.mockResolvedValue([row]);

      const result = await loader.invitesByInstanceId.load({
        organizationUnitId,
        instanceId: 'instance-1',
        userId: 'user-1',
      });

      expect(result).toEqual(row);
      expect(findInvites).toHaveBeenCalledWith(
        organizationUnitId,
        ['instance-1'],
        ['user-1'],
      );
    });

    it('returns null when no invite exists for the key', async () => {
      findInvites.mockResolvedValue([]);

      const result = await loader.invitesByInstanceId.load({
        organizationUnitId,
        instanceId: 'instance-1',
        userId: 'user-1',
      });

      expect(result).toBeNull();
    });

    it('batches multiple loads into a single findInvites call', async () => {
      const inviteOne = invite({
        id: 'invite-1',
        instanceId: 'instance-1',
        userId: 'user-1',
      });
      const inviteTwo = invite({
        id: 'invite-2',
        instanceId: 'instance-2',
        userId: 'user-2',
      });
      findInvites.mockResolvedValue([inviteOne, inviteTwo]);

      const [resultOne, resultTwo] = await Promise.all([
        loader.invitesByInstanceId.load({
          organizationUnitId,
          instanceId: 'instance-1',
          userId: 'user-1',
        }),
        loader.invitesByInstanceId.load({
          organizationUnitId,
          instanceId: 'instance-2',
          userId: 'user-2',
        }),
      ]);

      expect(resultOne).toEqual(inviteOne);
      expect(resultTwo).toEqual(inviteTwo);
      expect(findInvites).toHaveBeenCalledTimes(1);
      expect(findInvites).toHaveBeenCalledWith(
        organizationUnitId,
        ['instance-1', 'instance-2'],
        ['user-1', 'user-2'],
      );
    });

    it('deduplicates instance and user ids within a batch', async () => {
      const row = invite({ instanceId: 'instance-1', userId: 'user-1' });
      findInvites.mockResolvedValue([row]);

      await Promise.all([
        loader.invitesByInstanceId.load({
          organizationUnitId,
          instanceId: 'instance-1',
          userId: 'user-1',
        }),
        loader.invitesByInstanceId.load({
          organizationUnitId,
          instanceId: 'instance-1',
          userId: 'user-2',
        }),
        loader.invitesByInstanceId.load({
          organizationUnitId,
          instanceId: 'instance-2',
          userId: 'user-1',
        }),
      ]);

      expect(findInvites).toHaveBeenCalledWith(
        organizationUnitId,
        ['instance-1', 'instance-2'],
        ['user-1', 'user-2'],
      );
    });

    it('returns results in the same order as the requested keys', async () => {
      const inviteOne = invite({
        id: 'invite-1',
        instanceId: 'instance-1',
        userId: 'user-1',
      });
      const inviteTwo = invite({
        id: 'invite-2',
        instanceId: 'instance-2',
        userId: 'user-2',
      });
      findInvites.mockResolvedValue([inviteTwo, inviteOne]);

      const results = await loader.invitesByInstanceId.loadMany([
        {
          organizationUnitId,
          instanceId: 'instance-1',
          userId: 'user-1',
        },
        {
          organizationUnitId,
          instanceId: 'instance-missing',
          userId: 'user-missing',
        },
        {
          organizationUnitId,
          instanceId: 'instance-2',
          userId: 'user-2',
        },
      ]);

      expect(results).toEqual([inviteOne, null, inviteTwo]);
    });

    it('caches repeated loads for the same key', async () => {
      const row = invite({ instanceId: 'instance-1', userId: 'user-1' });
      findInvites.mockResolvedValue([row]);

      const key = {
        organizationUnitId,
        instanceId: 'instance-1',
        userId: 'user-1',
      };

      const first = await loader.invitesByInstanceId.load(key);
      const second = await loader.invitesByInstanceId.load(key);

      expect(first).toEqual(row);
      expect(second).toEqual(row);
      expect(findInvites).toHaveBeenCalledTimes(1);
    });
  });
});
