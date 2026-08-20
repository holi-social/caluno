jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import type { ShiftService } from '../shift.service';
import { ShiftInstanceLoader } from './shift-instance.loader';

describe('ShiftInstanceLoader', () => {
  describe('myInvitedAtByKey', () => {
    it('returns the createdAt for a matching instance and user', async () => {
      const createdAt = new Date('2026-08-12T10:00:00Z');
      const findInviteStatusesForUser = jest
        .fn()
        .mockResolvedValue([
          { shiftInstanceId: 'instance-1', status: 'INVITED', createdAt },
        ]);
      const loader = new ShiftInstanceLoader({
        findInviteStatusesForUser,
      } as unknown as ShiftService);

      const result = await loader.myInvitedAtByKey.load('instance-1::user-1');

      expect(result).toEqual(createdAt);
      expect(findInviteStatusesForUser).toHaveBeenCalledWith('user-1', [
        'instance-1',
      ]);
    });

    it('returns null when the user has no invite for the instance', async () => {
      const findInviteStatusesForUser = jest.fn().mockResolvedValue([]);
      const loader = new ShiftInstanceLoader({
        findInviteStatusesForUser,
      } as unknown as ShiftService);

      const result = await loader.myInvitedAtByKey.load('instance-1::user-1');

      expect(result).toBeNull();
    });

    it('batches multiple loads for the same user into one service call', async () => {
      const createdAt1 = new Date('2026-08-01T00:00:00Z');
      const createdAt2 = new Date('2026-08-02T00:00:00Z');
      const findInviteStatusesForUser = jest.fn().mockResolvedValue([
        {
          shiftInstanceId: 'instance-1',
          status: 'INVITED',
          createdAt: createdAt1,
        },
        {
          shiftInstanceId: 'instance-2',
          status: 'INVITED',
          createdAt: createdAt2,
        },
      ]);
      const loader = new ShiftInstanceLoader({
        findInviteStatusesForUser,
      } as unknown as ShiftService);

      const [result1, result2] = await Promise.all([
        loader.myInvitedAtByKey.load('instance-1::user-1'),
        loader.myInvitedAtByKey.load('instance-2::user-1'),
      ]);

      expect(result1).toEqual(createdAt1);
      expect(result2).toEqual(createdAt2);
      expect(findInviteStatusesForUser).toHaveBeenCalledTimes(1);
      expect(findInviteStatusesForUser).toHaveBeenCalledWith('user-1', [
        'instance-1',
        'instance-2',
      ]);
    });
  });
});
