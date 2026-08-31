import type { RequiredFormTargetType } from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
import type { RequiredFormItem } from './components/required-form-renderer';

type FormSubmission = {
  form?: { id?: string | null } | null;
};

/** Form ids the user has already submitted, derived from their submission history. */
export function buildSubmittedFormIds(
  submissions: FormSubmission[],
): Set<string> {
  return new Set(
    submissions
      .map((s) => s.form?.id)
      .filter((id): id is string => Boolean(id)),
  );
}

export type RequiredFormSource = {
  targetType: RequiredFormTargetType;
  targetId: string;
  refs: Array<{ form: RequiredForm; order: number }> | null | undefined;
};

/** Merges required-form refs from multiple targets (e.g. shift + instance + org unit) into one ordered, submitted-tagged list. */
export function resolveRequiredForms(
  sources: RequiredFormSource[],
  submittedFormIds: ReadonlySet<string>,
): RequiredFormItem[] {
  return sources
    .flatMap((source) =>
      (source.refs ?? []).map((ref) => ({
        form: ref.form,
        order: ref.order,
        submitted: submittedFormIds.has(ref.form.id),
        targetType: source.targetType,
        targetId: source.targetId,
      })),
    )
    .sort((a, b) => a.order - b.order);
}
