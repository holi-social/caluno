import { SYSTEM_PROFILE_KEYS } from './constants';

describe('SYSTEM_PROFILE_KEYS', () => {
  it('contains the core identity, contact, and IBAN keys', () => {
    expect(SYSTEM_PROFILE_KEYS).toEqual(
      new Set<string>([
        'name',
        'lastname',
        'preferred-name',
        'gender',
        'email',
        'phone',
        'address',
        'zip',
        'city',
        'birth-date',
        'iban',
      ]),
    );
  });
});
