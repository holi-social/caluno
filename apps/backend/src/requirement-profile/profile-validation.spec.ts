import { describe, expect, it } from 'bun:test';
import { validateSystemKeyValue } from './profile-validation';
import { BadRequestGraphQLError } from '../graphql/errors';

describe('validateSystemKeyValue', () => {
  const expectOk = (value: string, key: string) => {
    expect(() => validateSystemKeyValue(value, key, 'Label', null)).not.toThrow();
  };
  const expectBad = (value: string, key: string) => {
    expect(() => validateSystemKeyValue(value, key, 'Label', null)).toThrow(
      BadRequestGraphQLError,
    );
  };

  describe('bic', () => {
    it('accepts 8- and 11-char SWIFT-BIC values with or without spaces', () => {
      expectOk('COBADEFFXXX', 'bic');
      expectOk('COBADEFF', 'bic');
      expectOk('cobadeffxxx', 'bic'); // case-insensitive
      expectOk('COBA DEFF XXX', 'bic'); // whitespace ignored
    });

    it('rejects malformed BICs', () => {
      expectBad('', 'bic');
      expectBad('COB', 'bic'); // too short
      expectBad('COBADEFFXXXX', 'bic'); // too long
      expectBad('1234', 'bic'); // digits only
      expectBad('COBA-DEFF', 'bic'); // invalid char
    });

    it('requires the country code to be alpha', () => {
      expectBad('CO1ADEFFXXX', 'bic');
    });
  });

  describe('iban', () => {
    it('accepts a valid German IBAN (mod-97 checksum)', () => {
      expectOk('DE89 3704 0044 0532 0130 00', 'iban');
    });

    it('rejects an invalid checksum or malformed IBAN', () => {
      expectBad('DE89 3704 0044 0532 0130 01', 'iban');
      expectBad('DE00XX', 'iban');
      expectBad('', 'iban');
    });
  });
});
