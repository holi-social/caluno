import { describe, expect, it } from 'bun:test';
import { buildPageUrl } from './pagination';

describe('buildPageUrl', () => {
  it('merges the page param into an existing query string', () => {
    // All Shifts tab: url already carries `view=shifts`.
    expect(buildPageUrl('/admin/o/shifts?view=shifts', 2)).toBe(
      '/admin/o/shifts?view=shifts&page=2',
    );
  });

  it('adds the page param when the url has no query string', () => {
    // Event shifts section: url is a bare path.
    expect(buildPageUrl('/admin/o/events/42', 3)).toBe(
      '/admin/o/events/42?page=3',
    );
  });

  it('overwrites an existing page param instead of duplicating it', () => {
    expect(buildPageUrl('/admin/o/shifts?view=shifts&page=1', 5)).toBe(
      '/admin/o/shifts?view=shifts&page=5',
    );
  });
});
