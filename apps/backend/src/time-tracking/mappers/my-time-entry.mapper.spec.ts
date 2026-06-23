import { toMyTimeEntry } from './my-time-entry.mapper';

const baseEntity = {
  id: 'te-1',
  startedAt: new Date('2026-06-10T09:00:00Z'),
  endedAt: new Date('2026-06-10T13:30:00Z'),
  shiftInstance: {
    overrideTitle: null,
    master: {
      title: 'Kitchen Cleaning Crew',
      organizationUnit: {
        name: 'Downtown',
        organization: { name: 'Red Cross' },
      },
    },
  },
};

describe('toMyTimeEntry', () => {
  it('maps shift name, org, and org unit names', () => {
    const result = toMyTimeEntry(baseEntity as any);
    expect(result.shiftName).toBe('Front Desk');
    expect(result.organizationName).toBe('Red Cross');
    expect(result.organizationUnitName).toBe('Downtown');
  });

  it('prefers shiftInstance.overrideTitle over master.title', () => {
    const entity = {
      ...baseEntity,
      shiftInstance: {
        ...baseEntity.shiftInstance,
        overrideTitle: 'Special Edition',
      },
    };
    expect(toMyTimeEntry(entity as any).shiftName).toBe('Special Edition');
  });

  it('falls back to master.title when overrideTitle is null', () => {
    expect(toMyTimeEntry(baseEntity as any).shiftName).toBe('Front Desk');
  });

  it('preserves id, startedAt, endedAt', () => {
    const result = toMyTimeEntry(baseEntity as any);
    expect(result.id).toBe('te-1');
    expect(result.startedAt).toEqual(baseEntity.startedAt);
    expect(result.endedAt).toEqual(baseEntity.endedAt);
  });

  it('defaults names to empty string when relations are missing', () => {
    const broken = { ...baseEntity, shiftInstance: null } as any;
    const result = toMyTimeEntry(broken);
    expect(result.shiftName).toBe('');
    expect(result.organizationName).toBe('');
    expect(result.organizationUnitName).toBe('');
  });
});
