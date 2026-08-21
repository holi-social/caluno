import type { MembershipService } from '../membership/membership.service';
import type { OrganizationService } from '../organization/organization.service';
import { EventService } from './event.service';

describe('EventService.findAvailableEvents', () => {
  const findMany = jest.fn();
  const findUnits = jest.fn();
  const getPendingOrganizationUnitIds = jest.fn();

  const db = { query: { events: { findMany } } };
  const organizationService = { findUnits } as unknown as OrganizationService;
  const membershipService = {
    getPendingOrganizationUnitIds,
  } as unknown as MembershipService;

  const service = new EventService(
    db as never,
    membershipService,
    organizationService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    findMany.mockReset();
    findUnits.mockReset();
    getPendingOrganizationUnitIds.mockReset();
  });

  it('returns an empty page without querying when the user has no accepted or pending org units', async () => {
    findUnits.mockResolvedValue([]);
    getPendingOrganizationUnitIds.mockResolvedValue([]);

    const result = await service.findAvailableEvents(
      'user-1',
      null,
      null,
      null,
      15,
      0,
    );

    expect(result).toEqual({ events: [], total: 0 });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('unions accepted and pending org units into the query', async () => {
    findUnits.mockResolvedValue([{ id: 'accepted-unit' }]);
    getPendingOrganizationUnitIds.mockResolvedValue(['pending-unit']);
    findMany
      .mockResolvedValueOnce([{ id: 'event-1' }])
      .mockResolvedValueOnce([{ total: 1 }]);

    const result = await service.findAvailableEvents(
      'user-1',
      null,
      null,
      null,
      15,
      0,
    );

    expect(result).toEqual({ events: [{ id: 'event-1' }], total: 1 });
    expect(findMany).toHaveBeenCalledTimes(2);
    const rowsCallWhere = findMany.mock.calls[0]?.[0]?.where;
    expect(rowsCallWhere.organizationUnitId.in.sort()).toEqual(
      ['accepted-unit', 'pending-unit'].sort(),
    );
  });

  it('intersects requested organizationUnitIds with the accessible set, returning an empty page when none match', async () => {
    findUnits.mockResolvedValue([{ id: 'accepted-unit' }]);
    getPendingOrganizationUnitIds.mockResolvedValue(['pending-unit']);

    const result = await service.findAvailableEvents(
      'user-1',
      null,
      null,
      ['unrelated-unit'],
      15,
      0,
    );

    expect(result).toEqual({ events: [], total: 0 });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('narrows the query to the intersection when organizationUnitIds overlaps the accessible set', async () => {
    findUnits.mockResolvedValue([{ id: 'accepted-unit' }]);
    getPendingOrganizationUnitIds.mockResolvedValue(['pending-unit']);
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    await service.findAvailableEvents(
      'user-1',
      null,
      null,
      ['pending-unit', 'unrelated-unit'],
      15,
      0,
    );

    const rowsCallWhere = findMany.mock.calls[0]?.[0]?.where;
    expect(rowsCallWhere.organizationUnitId.in).toEqual(['pending-unit']);
  });

  it('excludes events the user has a participating invite for', async () => {
    findUnits.mockResolvedValue([{ id: 'accepted-unit' }]);
    getPendingOrganizationUnitIds.mockResolvedValue([]);
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    await service.findAvailableEvents('user-1', null, null, null, 15, 0);

    const rowsCallWhere = findMany.mock.calls[0]?.[0]?.where;
    expect(rowsCallWhere.NOT.invites).toEqual({
      userId: 'user-1',
      status: { in: ['ACCEPTED', 'SELF_JOINED'] },
    });
  });
});
