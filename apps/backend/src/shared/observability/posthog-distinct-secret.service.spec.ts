import { Logger } from '@nestjs/common';
import { PostHogDistinctSecretService } from './posthog-distinct-secret.service';

const TODAY = '2026-08-20';
const YESTERDAY = '2026-08-19';

type InsertChain = {
  insert: jest.Mock;
  returning: jest.Mock;
};

type SelectChain = {
  select: jest.Mock;
  where: jest.Mock;
};

function mockInsertReturning(rows: unknown[]): InsertChain {
  const returning = jest.fn().mockResolvedValue(rows);
  const onConflictDoUpdate = jest.fn().mockReturnValue({ returning });
  const values = jest.fn().mockReturnValue({ onConflictDoUpdate });
  const insert = jest.fn().mockReturnValue({ values });
  return { insert, returning };
}

function mockSelect(rows: unknown[]): SelectChain {
  const where = jest.fn().mockResolvedValue(rows);
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return { select, where };
}

function createService(
  insert: jest.Mock,
  select: jest.Mock,
): PostHogDistinctSecretService {
  return new PostHogDistinctSecretService({ insert, select } as never);
}

describe('PostHogDistinctSecretService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('inserts today’s secret when no row exists', async () => {
    const written = {
      slot: 'current',
      secret: 'a'.repeat(64),
      validForDate: TODAY,
    };
    const { insert } = mockInsertReturning([written]);
    const { select } = mockSelect([]);
    const service = createService(insert, select);

    const secret = await service.ensureCurrent();

    expect(secret).toBe(written.secret);
    expect(insert).toHaveBeenCalled();
  });

  it('reuses a row that is already valid for today without overwriting', async () => {
    const existing = {
      slot: 'current',
      secret: 'today-secret',
      validForDate: TODAY,
    };
    const { insert } = mockInsertReturning([]);
    const { select } = mockSelect([existing]);
    const service = createService(insert, select);

    const secret = await service.ensureCurrent();

    expect(secret).toBe('today-secret');
  });

  it('rotates a row whose date is yesterday and does not return the old secret', async () => {
    const rotated = {
      slot: 'current',
      secret: 'new-secret',
      validForDate: TODAY,
    };
    const { insert } = mockInsertReturning([rotated]);
    const { select } = mockSelect([
      { slot: 'current', secret: 'old-secret', validForDate: YESTERDAY },
    ]);
    const service = createService(insert, select);

    const secret = await service.ensureCurrent();

    expect(secret).toBe('new-secret');
    expect(secret).not.toBe('old-secret');
  });

  it('uses the winner’s secret when CAS returns no row (concurrent rotate)', async () => {
    const winner = {
      slot: 'current',
      secret: 'winner-secret',
      validForDate: TODAY,
    };
    const { insert } = mockInsertReturning([]);
    const { select } = mockSelect([winner]);
    const service = createService(insert, select);

    await expect(service.ensureCurrent()).resolves.toBe('winner-secret');
  });

  it('does not hit the database when today’s secret is already in memory', async () => {
    const written = {
      slot: 'current',
      secret: 'cached-secret',
      validForDate: TODAY,
    };
    const { insert } = mockInsertReturning([written]);
    const { select } = mockSelect([]);
    const service = createService(insert, select);

    await service.ensureCurrent();
    insert.mockClear();
    const secret = await service.ensureCurrent();

    expect(secret).toBe('cached-secret');
    expect(insert).not.toHaveBeenCalled();
  });

  it('returns null and does not throw when the database fails', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const insert = jest.fn().mockImplementation(() => {
      throw new Error('db down');
    });
    const { select } = mockSelect([]);
    const service = createService(insert, select);

    await expect(service.ensureCurrent()).resolves.toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('does not return yesterday’s cached secret after a failed rotate', async () => {
    const yesterdayRow = {
      slot: 'current',
      secret: 'old-secret',
      validForDate: YESTERDAY,
    };
    const { insert, returning } = mockInsertReturning([yesterdayRow]);
    const { select } = mockSelect([]);
    const service = createService(insert, select);

    jest.setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
    await expect(service.ensureCurrent()).resolves.toBe('old-secret');

    jest.setSystemTime(new Date('2026-08-20T10:00:00.000Z'));
    returning.mockRejectedValue(new Error('db down'));
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(service.ensureCurrent()).resolves.toBeNull();
    error.mockRestore();
  });
});
