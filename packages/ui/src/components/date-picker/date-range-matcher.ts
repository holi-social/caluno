import type { Matcher } from 'react-day-picker';

export const buildDateRangeDisabledMatcher = (
  minDate?: Date,
  maxDate?: Date,
): Matcher[] | undefined => {
  const matchers: Matcher[] = [];

  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });

  return matchers.length > 0 ? matchers : undefined;
};
