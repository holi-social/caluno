import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { CreateShiftInput } from '@repo/data';

const createMock = mock(async (_input: CreateShiftInput) => ({
  id: 'shift-1',
}));
const findInstancesMock = mock(
  async (_shiftId: string) =>
    [] as Array<{
      id: string;
      actualStartsAt: string;
    }>,
);

mock.module('@/lib/data-client', () => ({
  getDataClient: async () => ({
    shift: {
      create: createMock,
      findInstances: findInstancesMock,
    },
  }),
}));

const { createShift } = await import('../actions');
const { pickFirstShiftInstanceId, resolveCreateShiftSuccessNavigation } =
  await import('../create-shift-flow');

const validCreateInput = {
  organizationUnitId: 'org-unit-1',
  name: 'Morning shift',
  shiftType: 'non-paid' as const,
  startsAt: new Date('2026-06-24T08:00:00.000Z'),
  endsAt: new Date('2026-06-24T12:00:00.000Z'),
  invitedMemberIds: [] as string[],
};

describe('pickFirstShiftInstanceId', () => {
  it('returns the earliest instance by actualStartsAt', () => {
    expect(
      pickFirstShiftInstanceId([
        {
          id: 'instance-later',
          actualStartsAt: '2026-06-26T08:00:00.000Z',
        },
        {
          id: 'instance-first',
          actualStartsAt: '2026-06-24T08:00:00.000Z',
        },
        {
          id: 'instance-middle',
          actualStartsAt: '2026-06-25T08:00:00.000Z',
        },
      ]),
    ).toBe('instance-first');
  });

  it('returns undefined when there are no instances', () => {
    expect(pickFirstShiftInstanceId([])).toBeUndefined();
  });
});

describe('resolveCreateShiftSuccessNavigation', () => {
  it('opens the invite sheet when an instance id is present', () => {
    expect(
      resolveCreateShiftSuccessNavigation({
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    ).toEqual({
      action: 'open-invite',
      shiftId: 'shift-1',
      instanceId: 'instance-1',
    });
  });

  it('closes the create sheet when no instance id is present', () => {
    expect(
      resolveCreateShiftSuccessNavigation({
        shiftId: 'shift-1',
      }),
    ).toEqual({ action: 'close-create' });
  });
});

describe('createShift action', () => {
  beforeEach(() => {
    createMock.mockClear();
    findInstancesMock.mockClear();
    createMock.mockImplementation(async () => ({ id: 'shift-1' }));
    findInstancesMock.mockImplementation(async () => []);
  });

  it('creates a shift and returns the earliest instance id', async () => {
    findInstancesMock.mockImplementation(async () => [
      {
        id: 'instance-later',
        actualStartsAt: '2026-06-26T08:00:00.000Z',
      },
      {
        id: 'instance-first',
        actualStartsAt: '2026-06-24T08:00:00.000Z',
      },
    ]);

    const result = await createShift(validCreateInput);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(findInstancesMock).toHaveBeenCalledWith('shift-1');
    expect(result?.data).toEqual({
      id: 'shift-1',
      instanceId: 'instance-first',
    });
  });

  it('returns only the shift id when no instances exist', async () => {
    const result = await createShift(validCreateInput);

    expect(result?.data).toEqual({
      id: 'shift-1',
      instanceId: undefined,
    });
  });

  it('does not call onSuccess data when validation fails', async () => {
    const result = await createShift({
      ...validCreateInput,
      name: '   ',
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(findInstancesMock).not.toHaveBeenCalled();
    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
  });
});
