import { describe, expect, it } from 'bun:test';
import { PostHogService } from '../../shared/observability/posthog.service';
import { ShiftCallOutSource, ShiftVisibility } from '../enums';
import { ShiftCallOutService } from './shift-call-out.service';

const ORG_UNIT_ID = 'org-1';
const INSTANCE_ID = 'instance-1';

function makeInstance() {
  return {
    id: INSTANCE_ID,
    masterId: 'shift-1',
    isCancelled: false,
    actualStartsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    actualEndsAt: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    ),
    overrideTitle: null,
    overrideLocation: null,
    master: {
      organizationUnitId: ORG_UNIT_ID,
      visibility: ShiftVisibility.ALL_MEMBERS,
      title: 'Test Shift',
      location: null,
    },
  };
}

function setup() {
  const insertedRows: Array<Record<string, unknown>> = [];
  const sentEmails: Array<{ to: string }> = [];

  const db = {
    query: {
      organizationUnits: {
        findFirst: async () => ({ id: ORG_UNIT_ID, name: 'Org One' }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [],
      }),
    }),
    insert: () => ({
      values: (rows: Array<Record<string, unknown>>) => {
        insertedRows.push(...rows);
        return Promise.resolve();
      },
    }),
  };

  const shiftService = {
    findInstanceById: async () => makeInstance(),
  };

  const authService = {
    findUsersWithPermission: async () => [
      { id: 'manager-1', email: 'manager@example.com', name: 'Manager One' },
    ],
  };

  const membershipService = {
    getMembers: async () => [{ id: 'vol-1' }, { id: 'vol-2' }, { id: 'vol-3' }],
  };

  const notificationService = {
    resolveUsersNotificationData: async (userIds: string[]) =>
      userIds.map((userId) => ({
        userId,
        email: `${userId}@example.com`,
        name: userId,
        firstName: userId,
        locale: 'en',
      })),
  };

  const emailService = {
    send: async (options: { to: string }) => {
      sentEmails.push(options);
    },
  };

  const appI18n = {
    createTranslator: () => ({ t: (key: string) => key }),
  };

  const postHogService = {
    capture: async (options: PostHogService) => {},
  };

  const service = new ShiftCallOutService(
    db as never,
    shiftService as never,
    authService as never,
    membershipService as never,
    notificationService as never,
    emailService as never,
    appI18n as never,
    postHogService as never,
  );

  return { service, insertedRows, sentEmails };
}

describe('ShiftCallOutService.sendCallOut', () => {
  it('excludes explicitly given user ids even though they are otherwise eligible', async () => {
    const { service, insertedRows } = setup();

    const result = await service.sendCallOut(
      INSTANCE_ID,
      ORG_UNIT_ID,
      'actor-1',
      { excludeUserIds: ['vol-2'] },
    );

    expect(result.recipientCount).toBe(2);
    expect(insertedRows.map((row) => row.recipientId).sort()).toEqual([
      'vol-1',
      'vol-3',
    ]);
  });

  it('tags manual sends as MANUAL by default', async () => {
    const { service, insertedRows } = setup();

    await service.sendCallOut(INSTANCE_ID, ORG_UNIT_ID, 'actor-1');

    expect(insertedRows.length).toBeGreaterThan(0);
    for (const row of insertedRows) {
      expect(row.source).toBe(ShiftCallOutSource.MANUAL);
    }
  });

  it('tags automatic sends as AUTOMATIC when requested', async () => {
    const { service, insertedRows } = setup();

    await service.sendCallOut(INSTANCE_ID, ORG_UNIT_ID, 'system-automated', {
      source: ShiftCallOutSource.AUTOMATIC,
    });

    expect(insertedRows.length).toBeGreaterThan(0);
    for (const row of insertedRows) {
      expect(row.source).toBe(ShiftCallOutSource.AUTOMATIC);
    }
  });
});

describe('ShiftCallOutService.getCallOutHistory', () => {
  const t1 = new Date('2026-09-01T10:00:00.000Z');
  const t2 = new Date('2026-09-02T10:00:00.000Z');

  function historyService(rows: Array<Record<string, unknown>>) {
    const db = {
      select: () => ({
        from: () => ({ where: async () => rows }),
      }),
    };
    return new ShiftCallOutService(
      db as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }

  it('groups recipient rows of the same send into one batch and returns newest first', async () => {
    const service = historyService([
      // instance-1, oldest send (2 recipients)
      { instanceId: INSTANCE_ID, sentAt: t1, sentById: 'm1', source: 'MANUAL' },
      { instanceId: INSTANCE_ID, sentAt: t1, sentById: 'm1', source: 'MANUAL' },
      // instance-1, newest AUTOMATIC send (1 recipient)
      {
        instanceId: INSTANCE_ID,
        sentAt: t2,
        sentById: 'm2',
        source: 'AUTOMATIC',
      },
    ]);

    const history = await service.getCallOutHistory([INSTANCE_ID]);

    expect(history.get(INSTANCE_ID)).toEqual([
      {
        sentAt: t2,
        recipientCount: 1,
        source: 'AUTOMATIC',
        sentById: 'm2',
      },
      {
        sentAt: t1,
        recipientCount: 2,
        source: 'MANUAL',
        sentById: 'm1',
      },
    ]);
  });

  it('returns an empty list for an instance with no call-outs', async () => {
    const service = historyService([
      {
        instanceId: 'other-instance',
        sentAt: t1,
        sentById: 'm1',
        source: 'MANUAL',
      },
    ]);

    const history = await service.getCallOutHistory([INSTANCE_ID]);

    expect(history.get(INSTANCE_ID)).toEqual([]);
  });

  it('returns only the most recent batch from getLastCallOutSummaries', async () => {
    const service = historyService([
      { instanceId: INSTANCE_ID, sentAt: t1, sentById: 'm1', source: 'MANUAL' },
      { instanceId: INSTANCE_ID, sentAt: t2, sentById: 'm1', source: 'MANUAL' },
      { instanceId: INSTANCE_ID, sentAt: t2, sentById: 'm1', source: 'MANUAL' },
    ]);

    const summaries = await service.getLastCallOutSummaries([INSTANCE_ID]);

    expect(summaries.get(INSTANCE_ID)).toEqual({
      sentAt: t2,
      recipientCount: 2,
      source: 'MANUAL',
      sentById: 'm1',
    });
  });
});
