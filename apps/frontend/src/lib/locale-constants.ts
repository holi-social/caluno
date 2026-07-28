// Local literal (not re-exported from `@repo/data`) so the edge middleware
// bundle in `proxy.ts` never pulls the `@repo/data` barrel. Must stay in sync
// with `LOCALE_COOKIE` in `packages/data/src/constants.ts` (the auth client
// reads the same cookie for the `x-locale` header).
export const USER_LOCALE_COOKIE = 'clippy.locale';
