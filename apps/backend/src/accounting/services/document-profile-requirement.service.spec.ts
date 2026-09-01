import { describe, expect, it } from 'bun:test';
import { DocumentProfileRequirementService } from './document-profile-requirement.service';

describe('DocumentProfileRequirementService', () => {
  const db = {} as never;
  const userProfileService = {
    findByUserId: () => Promise.resolve(undefined),
  } as never;
  const service = new DocumentProfileRequirementService(db, userProfileService);

  it('collects profile-required sources from enabled lines only', () => {
    const body = {
      header: {
        orgIdentityLine: {
          text: '{orgName}',
          enabled: true,
          fields: [{ value: { kind: 'bound', source: 'org_name' } }],
        },
      },
      blocks: [
        {
          enabled: true,
          lines: [
            {
              text: '{volunteerIban}',
              enabled: true,
              fields: [{ value: { kind: 'bound', source: 'volunteer_iban' } }],
            },
            {
              text: '{volunteerAddress}',
              enabled: false,
              fields: [
                { value: { kind: 'bound', source: 'volunteer_address' } },
              ],
            },
          ],
        },
        {
          enabled: true,
          line: {
            text: '{volunteerBic}',
            enabled: true,
            fields: [{ value: { kind: 'bound', source: 'volunteer_bic' } }],
          },
        },
      ],
      footer: {
        closingLine: {
          text: '{volunteerDob}',
          enabled: true,
          fields: [{ value: { kind: 'bound', source: 'volunteer_dob' } }],
        },
      },
    };

    expect(service.requiredProfileSources(body).sort()).toEqual([
      'volunteer_bic',
      'volunteer_dob',
      'volunteer_iban',
    ]);
  });

  it('returns empty when the template binds nothing profile-required', async () => {
    const body = {
      header: {
        orgIdentityLine: {
          text: '{orgName}',
          enabled: true,
          fields: [{ value: { kind: 'bound', source: 'org_name' } }],
        },
      },
    };
    // No profile stored → still only the bound sources matter.
    expect(await service.missingProfileSources('v-1', body)).toEqual([]);
  });

  it('reports a source as missing when the profile value is empty', async () => {
    const serviceWithProfile = new DocumentProfileRequirementService(db, {
      findByUserId: () =>
        Promise.resolve({
          data: { iban: 'DE00 0000 0000 0000 0000 00', bic: '' },
        }),
    } as never);
    const body = {
      blocks: [
        {
          lines: [
            {
              enabled: true,
              fields: [
                { value: { kind: 'bound', source: 'volunteer_iban' } },
                { value: { kind: 'bound', source: 'volunteer_bic' } },
              ],
            },
          ],
        },
      ],
    };
    expect(await serviceWithProfile.missingProfileSources('v-1', body)).toEqual(
      ['volunteer_bic'],
    );
  });

  it('reports org city as missing when the org unit has no city, but not name/address', async () => {
    const dbWithOrg = {
      query: {
        organizationUnits: {
          findFirst: () =>
            Promise.resolve({ id: 'unit-1', name: 'Playground', address: 'Straße 1', city: '' }),
        },
      },
    } as never;
    const serviceWithOrg = new DocumentProfileRequirementService(
      dbWithOrg,
      userProfileService,
    );
    const body = {
      header: {
        orgIdentityLine: {
          enabled: true,
          fields: [
            { value: { kind: 'bound', source: 'org_name' } },
            { value: { kind: 'bound', source: 'org_address' } },
            { value: { kind: 'bound', source: 'org_city' } },
          ],
        },
      },
    };
    // name is always present, address is present, city is empty → only org_city.
    expect(await serviceWithOrg.missingOrgProfileSources('unit-1', body)).toEqual(
      ['org_city'],
    );
  });
});
