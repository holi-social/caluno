import { describe, expect, it } from 'bun:test';
import { DocumentProfileRequirementService } from './document-profile-requirement.service';

describe('DocumentProfileRequirementService', () => {
  const userProfileService = {
    findByUserId: () => Promise.resolve(undefined),
  } as never;
  const service = new DocumentProfileRequirementService(userProfileService);

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
    const serviceWithProfile = new DocumentProfileRequirementService({
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
});
