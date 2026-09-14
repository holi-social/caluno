import { isUniqueConstraintViolation } from './constraint-violation.util';

describe('isUniqueConstraintViolation', () => {
  it('returns true when a Drizzle-wrapped cause matches the constraint', () => {
    const error = new Error('Failed query', {
      cause: {
        code: '23505',
        constraint: 'uq_roles_name_organization_unit_id',
      },
    });

    expect(
      isUniqueConstraintViolation(error, 'uq_roles_name_organization_unit_id'),
    ).toBe(true);
  });

  it('returns true when the driver error is unwrapped', () => {
    expect(
      isUniqueConstraintViolation(
        {
          code: '23505',
          constraint: 'uq_time_entries_open_per_instance_volunteer',
        },
        'uq_time_entries_open_per_instance_volunteer',
      ),
    ).toBe(true);
  });

  it('returns false for a different constraint', () => {
    const error = new Error('Failed query', {
      cause: {
        code: '23505',
        constraint: 'uq_roles_name_organization_unit_id',
      },
    });

    expect(
      isUniqueConstraintViolation(
        error,
        'uq_time_entries_open_per_instance_volunteer',
      ),
    ).toBe(false);
  });

  it('returns false for non-unique-violation SQLSTATE codes', () => {
    const error = new Error('Failed query', {
      cause: {
        code: '23503',
        constraint: 'uq_roles_name_organization_unit_id',
      },
    });

    expect(
      isUniqueConstraintViolation(error, 'uq_roles_name_organization_unit_id'),
    ).toBe(false);
  });
});
