import type { RequirementForm } from '@repo/data';

export type BuilderBlockRef = NonNullable<RequirementForm['blockRefs']>[number];

export function canSave(
  blockRefs: readonly BuilderBlockRef[],
  hasSubmissions: boolean,
): boolean {
  return !hasSubmissions && blockRefs.length > 0;
}

export function appendBlockRef(
  refs: readonly BuilderBlockRef[],
  blockId: string,
  formId: string,
): BuilderBlockRef[] {
  if (refs.some((r) => r.blockId === blockId)) return [...refs];
  return [
    ...refs,
    {
      id: `temp-${crypto.randomUUID()}`,
      formId,
      blockId,
      fieldOrder: refs.length,
      required: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function moveBlockRef(
  refs: readonly BuilderBlockRef[],
  index: number,
  direction: 'up' | 'down',
): BuilderBlockRef[] {
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (
    index < 0 ||
    index >= refs.length ||
    swapIndex < 0 ||
    swapIndex >= refs.length
  ) {
    return refs as BuilderBlockRef[];
  }
  const next = [...refs];
  const temp = next[index] as BuilderBlockRef;
  next[index] = next[swapIndex] as BuilderBlockRef;
  next[swapIndex] = temp;
  return next.map((ref, i) => ({ ...ref, fieldOrder: i }));
}

export function removeBlockRef(
  refs: readonly BuilderBlockRef[],
  index: number,
): BuilderBlockRef[] {
  return refs
    .filter((_, i) => i !== index)
    .map((ref, i) => ({ ...ref, fieldOrder: i }));
}
