// Locale-relative path builders.
//
// next-intl's `<Link>` (from `@/i18n/navigation`) prepends the active locale
// (`localePrefix: 'always'` in `@/i18n/routing`), so these helpers must NOT
// include a `/${locale}` segment — pass the bare app path.
export const routes = {
  publicForm: (token: string) => `/f/${token}`,
  formSubmission: (submissionId: string) =>
    `/forms/submissions/${submissionId}`,
};
