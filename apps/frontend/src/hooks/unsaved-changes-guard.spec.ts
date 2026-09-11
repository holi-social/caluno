import { describe, expect, it } from 'bun:test';
import {
  computeLeaveDelta,
  isGuardableLinkClick,
  isGuardDummyState,
  type LinkClickDetails,
  markGuardState,
  stripLocalePrefix,
} from './unsaved-changes-guard';

const currentUrl = new URL('https://app.example.com/de/admin/org-1/forms');

function makeClick(
  overrides: Partial<LinkClickDetails> = {},
): LinkClickDetails {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: '',
    hasDownloadAttribute: false,
    rawHref: '/de/admin/org-1/other',
    ...overrides,
  };
}

describe('isGuardableLinkClick', () => {
  it('is true for a plain internal link to another page', () => {
    expect(isGuardableLinkClick(makeClick(), currentUrl)).toBe(true);
  });

  it('is true for a same-page link with different search params', () => {
    expect(
      isGuardableLinkClick(
        makeClick({ rawHref: '/de/admin/org-1/forms?sheet=new' }),
        currentUrl,
      ),
    ).toBe(true);
  });

  it('is false for a hash-only link on the current page', () => {
    expect(
      isGuardableLinkClick(makeClick({ rawHref: '#section' }), currentUrl),
    ).toBe(false);
  });

  it('is false for a link to an external origin', () => {
    expect(
      isGuardableLinkClick(
        makeClick({ rawHref: 'https://other.example.com/de/admin' }),
        currentUrl,
      ),
    ).toBe(false);
  });

  it('is false for non-http schemes like mailto', () => {
    expect(
      isGuardableLinkClick(makeClick({ rawHref: 'mailto:a@b.ch' }), currentUrl),
    ).toBe(false);
  });

  it('is false when a modifier key is held', () => {
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(isGuardableLinkClick(makeClick({ [key]: true }), currentUrl)).toBe(
        false,
      );
    }
  });

  it('is false for non-primary mouse buttons', () => {
    expect(isGuardableLinkClick(makeClick({ button: 1 }), currentUrl)).toBe(
      false,
    );
  });

  it('is false for links opening in a new context', () => {
    expect(
      isGuardableLinkClick(makeClick({ target: '_blank' }), currentUrl),
    ).toBe(false);
  });

  it('is false for download links', () => {
    expect(
      isGuardableLinkClick(
        makeClick({ hasDownloadAttribute: true }),
        currentUrl,
      ),
    ).toBe(false);
  });

  it('is false for an empty href', () => {
    expect(isGuardableLinkClick(makeClick({ rawHref: '' }), currentUrl)).toBe(
      false,
    );
  });
});

describe('stripLocalePrefix', () => {
  it('removes a known locale first segment', () => {
    expect(stripLocalePrefix('/de/admin/org-1', ['en', 'de'])).toBe(
      '/admin/org-1',
    );
  });

  it('keeps the path when no locale prefix is present', () => {
    expect(stripLocalePrefix('/admin/org-1', ['en', 'de'])).toBe(
      '/admin/org-1',
    );
  });

  it('maps a bare locale path to root', () => {
    expect(stripLocalePrefix('/de', ['en', 'de'])).toBe('/');
  });

  it('preserves query strings and hashes', () => {
    expect(stripLocalePrefix('/de/forms?a=1#top', ['en', 'de'])).toBe(
      '/forms?a=1#top',
    );
  });

  it('does not strip path segments that merely look like locales', () => {
    expect(stripLocalePrefix('/deals', ['en', 'de'])).toBe('/deals');
  });
});

describe('guard history state markers', () => {
  it('marks a null state', () => {
    expect(isGuardDummyState(markGuardState(null))).toBe(true);
  });

  it('preserves existing state keys when marking', () => {
    const marked = markGuardState({ __NA: true, index: 3 });
    expect(isGuardDummyState(marked)).toBe(true);
    expect(marked.__NA).toBe(true);
    expect(marked.index).toBe(3);
  });

  it('does not mutate the original state', () => {
    const original = { __NA: true };
    markGuardState(original);
    expect(isGuardDummyState(original)).toBe(false);
  });

  it('rejects untagged states', () => {
    expect(isGuardDummyState(null)).toBe(false);
    expect(isGuardDummyState(undefined)).toBe(false);
    expect(isGuardDummyState({})).toBe(false);
    expect(isGuardDummyState({ __unsavedChangesGuard: false })).toBe(false);
    expect(isGuardDummyState('__unsavedChangesGuard')).toBe(false);
  });
});

describe('computeLeaveDelta', () => {
  const guardedPathname = '/de/admin/org-1/forms/form-1/builder';

  it('skips the re-pushed dummy and the guarded entry (-2)', () => {
    expect(
      computeLeaveDelta({
        landedPathname: guardedPathname,
        guardedPathname,
        hasPriorEntry: true,
      }),
    ).toBe(-2);
  });

  it('skips only the dummy when the pop already left the page (-1)', () => {
    expect(
      computeLeaveDelta({
        landedPathname: '/de/admin/org-1/forms',
        guardedPathname,
        hasPriorEntry: true,
      }),
    ).toBe(-1);
  });

  it('returns null when there is no prior entry to go back to', () => {
    expect(
      computeLeaveDelta({
        landedPathname: guardedPathname,
        guardedPathname,
        hasPriorEntry: false,
      }),
    ).toBeNull();
  });
});
