jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { Test } from '@nestjs/testing';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { MembershipService } from '../membership/membership.service';
import { TimeTrackingService } from './time-tracking.service';

describe('TimeTrackingService — findMyEntries', () => {
  let service: TimeTrackingService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    const dbMock = {
      query: {
        timeEntries: { findMany },
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        { provide: DATABASE_CONNECTION, useValue: dbMock },
        { provide: MembershipService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(TimeTrackingService);
  });

  // Security boundary: the DB query must filter by volunteerId so a volunteer
  // only ever sees their own entries, across all organisations.
  it('scopes the query to the requesting user only (cross-org, no org-unit filter)', async () => {
    findMany.mockResolvedValue([]);

    await service.findMyEntries('user-me', { offset: 0, limit: 10 });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { volunteerId: 'user-me' } }),
    );
  });

  it('orders entries newest first', async () => {
    findMany.mockResolvedValue([]);

    await service.findMyEntries('user-me', { offset: 0, limit: 10 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startedAt: 'desc' } }),
    );
  });

  it('paginates the results and reports the unpaginated total', async () => {
    const all = [{ id: '1' }, { id: '2' }, { id: '3' }];
    findMany.mockResolvedValue(all);

    const result = await service.findMyEntries('user-me', {
      offset: 0,
      limit: 2,
    });

    expect(result).toEqual({
      entries: [{ id: '1' }, { id: '2' }],
      total: 3,
    });
  });

  it('respects offset when paginating', async () => {
    const all = [{ id: '1' }, { id: '2' }, { id: '3' }];
    findMany.mockResolvedValue(all);

    const result = await service.findMyEntries('user-me', {
      offset: 1,
      limit: 2,
    });

    expect(result).toEqual({
      entries: [{ id: '2' }, { id: '3' }],
      total: 3,
    });
  });
});
