import { describe, expect, it } from 'bun:test';
import {
  formValueFromOtpDigits,
  INCOMPLETE_BIRTH_DATE_VALUE,
  otpDigitsFromStoredDate,
} from './birth-date-segments';

describe('birth-date-segments', () => {
  it('otpDigitsFromStoredDate maps ISO to DDMMYYYY', () => {
    expect(otpDigitsFromStoredDate('1990-03-15')).toBe('15031990');
    expect(otpDigitsFromStoredDate('')).toBe('');
    expect(otpDigitsFromStoredDate(INCOMPLETE_BIRTH_DATE_VALUE)).toBe('');
  });

  it('formValueFromOtpDigits emits empty, ISO, or incomplete', () => {
    expect(formValueFromOtpDigits('')).toBe('');
    expect(formValueFromOtpDigits('1503')).toBe(INCOMPLETE_BIRTH_DATE_VALUE);
    expect(formValueFromOtpDigits('15031990')).toBe('1990-03-15');
    expect(formValueFromOtpDigits('31021990')).toBe(
      INCOMPLETE_BIRTH_DATE_VALUE,
    );
    expect(formValueFromOtpDigits('29022024')).toBe('2024-02-29');
    expect(Number.isNaN(Date.parse(INCOMPLETE_BIRTH_DATE_VALUE))).toBe(true);
  });
});
