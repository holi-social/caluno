/** Browser/client noise that must never create Sentry issues. */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications.',
  /^AbortError/,
  'The operation was aborted',
  'The user aborted a request',
  'Failed to fetch',
  'Load failed',
  'NetworkError when attempting to fetch resource.',
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-web-extension:\/\//,
];

/**
 * GraphQL `extensions.code` values that are expected control flow
 * (mirror the domain errors in apps/backend/src/graphql/errors/).
 */
export const EXPECTED_GRAPHQL_ERROR_CODES = [
  'BAD_REQUEST',
  'CONFLICT',
  'FORBIDDEN',
  'NOT_FOUND',
  'UNPROCESSABLE_ENTITY',
  'UNAUTHENTICATED',
] as const;

export function isExpectedGraphqlCode(code: unknown): boolean {
  return (
    typeof code === 'string' &&
    (EXPECTED_GRAPHQL_ERROR_CODES as readonly string[]).includes(code)
  );
}
