'use client';

import { useEffect, useRef } from 'react';
import { routing } from '@/i18n/routing';
import {
  computeLeaveDelta,
  type GuardedNavigation,
  isGuardableLinkClick,
  isGuardDummyState,
  markGuardState,
  stripLocalePrefix,
} from './unsaved-changes-guard';

export type { GuardedNavigation } from './unsaved-changes-guard';

/**
 * Removes the locale prefix from a captured href so it can be passed to the
 * locale-aware router (which re-adds the prefix itself).
 */
export function stripKnownLocalePrefix(path: string): string {
  return stripLocalePrefix(path, routing.locales);
}

interface UseUnsavedChangesGuardOptions {
  enabled: boolean;
  onPrompt: (target: GuardedNavigation) => void;
}

interface UnsavedChangesGuard {
  /**
   * Disarms the guard without unwinding history. Call right before
   * performing a confirmed navigation so the resulting popstate is not
   * intercepted and re-prompted.
   */
  release: () => void;
}

/**
 * Blocks every way out of the current page while `enabled` is true:
 * tab close/refresh (native beforeunload dialog), internal link clicks
 * (captured globally, so shared navigation needs no changes) and the
 * browser back/forward buttons. Blocked navigation is reported via
 * `onPrompt` so the caller can show a confirm dialog and, on confirm,
 * perform the navigation itself.
 *
 * Back/forward protection works by pushing a dummy history entry whose
 * state is tagged via `markGuardState`. A popstate landing on a tagged
 * entry is in-page history movement (e.g. a sheet closing, which pushes
 * same-path entries via the router) — the barrier is restored without
 * prompting. A popstate landing on an untagged entry is an exit attempt
 * and prompts with a `delta` (see `computeLeaveDelta`) for the confirmed
 * navigation. When the guard disarms while still sitting on its dummy
 * entry (e.g. after a save), the entry is unwound so the back button
 * stays responsive.
 */
export function useUnsavedChangesGuard({
  enabled,
  onPrompt,
}: UseUnsavedChangesGuardOptions): UnsavedChangesGuard {
  const onPromptRef = useRef(onPrompt);
  const releasedRef = useRef(false);

  useEffect(() => {
    onPromptRef.current = onPrompt;
  }, [onPrompt]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleClick = (event: MouseEvent) => {
      if (releasedRef.current) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const currentUrl = new URL(window.location.href);
      if (
        !isGuardableLinkClick(
          {
            button: event.button,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            target: anchor.target,
            hasDownloadAttribute: anchor.hasAttribute('download'),
            rawHref: anchor.getAttribute('href') ?? '',
          },
          currentUrl,
        )
      ) {
        return;
      }
      event.preventDefault();
      const url = new URL(anchor.href);
      onPromptRef.current({
        type: 'href',
        href: url.pathname + url.search + url.hash,
      });
    };
    document.addEventListener('click', handleClick, true);

    const guardedPathname = window.location.pathname;
    // history.length counts the whole tab session including forward
    // entries, so this can only false-positive (rare, safe direction).
    const hasPriorEntry = window.history.length > 1;

    // The dummy carries the current entry's state (including the Next.js
    // router state) so a pop onto it still renders the guarded page.
    const pushDummy = () => {
      window.history.pushState(
        markGuardState(window.history.state),
        '',
        window.location.href,
      );
    };

    const handlePopState = () => {
      if (releasedRef.current) return;
      const isExit = !isGuardDummyState(window.history.state);
      // Restore the barrier at the top of the stack either way.
      pushDummy();
      if (!isExit) return;
      onPromptRef.current({
        type: 'back',
        delta: computeLeaveDelta({
          landedPathname: window.location.pathname,
          guardedPathname,
          hasPriorEntry,
        }),
      });
    };
    // Push a dummy entry so the first back press fires popstate here
    // instead of leaving the page.
    pushDummy();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      // Keep arming/disarming stack-neutral: if the guard disarms while
      // still sitting on its dummy entry (e.g. the form was saved), step
      // back off it so the next back press is not a silent no-op.
      if (!releasedRef.current && isGuardDummyState(window.history.state)) {
        window.history.back();
      }
    };
  }, [enabled]);

  return {
    release: () => {
      releasedRef.current = true;
    },
  };
}
