export const dateOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
} as const satisfies Intl.DateTimeFormatOptions;

export const dateTimeOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const satisfies Intl.DateTimeFormatOptions;

export const timeOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
} as const satisfies Intl.DateTimeFormatOptions;
