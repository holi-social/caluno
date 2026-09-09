import { PostHogOrgLabelService } from './posthog-org-label.service';

describe('PostHogOrgLabelService', () => {
  const organizationUnits = { findFirst: jest.fn() };
  const organizations = { findFirst: jest.fn() };
  const db = { query: { organizationUnits, organizations } };
  const service = new PostHogOrgLabelService(db as never);

  beforeEach(() => {
    organizationUnits.findFirst.mockReset();
    organizations.findFirst.mockReset();
  });

  it('returns nothing when no ids are present', async () => {
    await expect(service.resolve({})).resolves.toEqual({});
    expect(organizationUnits.findFirst).not.toHaveBeenCalled();
    expect(organizations.findFirst).not.toHaveBeenCalled();
  });

  it('resolves the organization name from organization_id', async () => {
    organizations.findFirst.mockResolvedValue({
      id: 'org-1',
      name: 'Acme Volunteers',
    });

    await expect(service.resolve({ organizationId: 'org-1' })).resolves.toEqual(
      {
        organization_id: 'org-1',
        organization_name: 'Acme Volunteers',
      },
    );
    expect(organizationUnits.findFirst).not.toHaveBeenCalled();
  });

  it('resolves unit name and fills organization from the unit', async () => {
    organizationUnits.findFirst.mockResolvedValue({
      id: 'ou-1',
      name: 'Berlin',
      organizationId: 'org-1',
    });
    organizations.findFirst.mockResolvedValue({
      id: 'org-1',
      name: 'Acme Volunteers',
    });

    await expect(
      service.resolve({ organizationUnitId: 'ou-1' }),
    ).resolves.toEqual({
      organization_id: 'org-1',
      organization_name: 'Acme Volunteers',
      organization_unit_id: 'ou-1',
      organization_unit_name: 'Berlin',
    });
  });

  it('keeps ids when rows are missing', async () => {
    organizationUnits.findFirst.mockResolvedValue(undefined);
    organizations.findFirst.mockResolvedValue(undefined);

    await expect(
      service.resolve({
        organizationId: 'org-missing',
        organizationUnitId: 'ou-missing',
      }),
    ).resolves.toEqual({
      organization_id: 'org-missing',
      organization_unit_id: 'ou-missing',
    });
  });
});
