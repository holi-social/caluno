'use client';

import { JoinStatus } from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * Shared join/follow gating rule: when both the target (shift/instance/event) and the
 * organization unit have required forms configured, the user must fill them out together
 * on a combined forms page before joining, rather than being gated form-by-form after the fact.
 */
export function useRequiredFormsGate(
  membershipState: JoinStatus,
  targetRequiredForms: RequiredForm[],
  organizationUnitRequiredForms: RequiredForm[],
  combinedFormsPath: string | null,
) {
  const router = useRouter();

  const needsCombinedForms =
    membershipState === JoinStatus.None &&
    targetRequiredForms.length > 0 &&
    organizationUnitRequiredForms.length > 0;

  const goToCombinedForms = useCallback((): boolean => {
    if (!combinedFormsPath) {
      return false;
    }
    router.push(`${combinedFormsPath}?redirectTo=/`);
    return true;
  }, [router, combinedFormsPath]);

  return { needsCombinedForms, goToCombinedForms };
}
