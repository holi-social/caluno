/** Non-parseable value while digits are non-empty but not a valid date. */
export const INCOMPLETE_BIRTH_DATE_VALUE = 'incomplete';

/** DDMMYYYY digits from a stored ISO/date value; empty when cleared/incomplete. */
export function otpDigitsFromStoredDate(value: string): string {
  if (!value || value === INCOMPLETE_BIRTH_DATE_VALUE) return '';

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnly) {
    const [, year = '', month = '', day = ''] = dateOnly;
    return `${day}${month}${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getUTCFullYear().toString().padStart(4, '0');
  const month = (parsed.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = parsed.getUTCDate().toString().padStart(2, '0');
  return `${day}${month}${year}`;
}

/** '' when empty, YYYY-MM-DD when valid, otherwise incomplete sentinel. */
export function formValueFromOtpDigits(digits: string): string {
  if (!digits) return '';
  if (digits.length < 8) return INCOMPLETE_BIRTH_DATE_VALUE;

  const day = Number.parseInt(digits.slice(0, 2), 10);
  const month = Number.parseInt(digits.slice(2, 4), 10);
  const year = Number.parseInt(digits.slice(4, 8), 10);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return INCOMPLETE_BIRTH_DATE_VALUE;
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
