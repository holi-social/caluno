import type { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import type { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import { TimeEntryLoader } from './time-entry.loader';

describe('TimeEntryLoader', () => {
  describe('organizationUnitById', () => {
    it('batches ids into one findByIds call and maps results in key order', async () => {
      const unitA = { id: 'unit-a' };
      const unitB = { id: 'unit-b' };
      const findByIds = jest.fn().mockResolvedValue([unitB, unitA]);
      const toModelOrThrow = jest
        .fn()
        .mockImplementation((entity: { id: string }) => ({
          id: entity.id,
          mapped: true,
        }));
      const loader = new TimeEntryLoader(
        { findByIds } as unknown as OrganizationUnitDataService,
        { toModelOrThrow } as unknown as OrganizationUnitMapper,
      );

      const [a, b] = await Promise.all([
        loader.organizationUnitById.load('unit-a'),
        loader.organizationUnitById.load('unit-b'),
      ]);

      expect(findByIds).toHaveBeenCalledTimes(1);
      expect(findByIds).toHaveBeenCalledWith(['unit-a', 'unit-b']);
      expect(a).toEqual({ id: 'unit-a', mapped: true });
      expect(b).toEqual({ id: 'unit-b', mapped: true });
    });

    it('returns NotFoundGraphQLError for an unknown id without failing the batch', async () => {
      const findByIds = jest.fn().mockResolvedValue([{ id: 'unit-a' }]);
      const toModelOrThrow = jest
        .fn()
        .mockImplementation((entity: { id: string }) => ({ id: entity.id }));
      const loader = new TimeEntryLoader(
        { findByIds } as unknown as OrganizationUnitDataService,
        { toModelOrThrow } as unknown as OrganizationUnitMapper,
      );

      const [a, missing] = await Promise.allSettled([
        loader.organizationUnitById.load('unit-a'),
        loader.organizationUnitById.load('unit-missing'),
      ]);

      expect(a.status).toBe('fulfilled');
      expect(missing.status).toBe('rejected');
    });
  });
});
