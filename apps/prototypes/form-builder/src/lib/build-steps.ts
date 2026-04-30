import type { ResolvedBlock, FormField } from './types';

export type DisplayStep = {
  block: ResolvedBlock;
  documentField?: FormField;
};

export function buildDisplaySteps(blocks: ResolvedBlock[]): DisplayStep[] {
  const steps: DisplayStep[] = [];

  for (const block of blocks) {
    const docFields = block.fields.filter(
      (f) => f.type === 'document-acknowledgement',
    );
    const nonDocFields = block.fields.filter(
      (f) => f.type !== 'document-acknowledgement',
    );

    if (nonDocFields.length > 0) {
      steps.push({
        block: { ...block, fields: nonDocFields },
      });
    }

    for (const docField of docFields) {
      steps.push({
        block: {
          ...block,
          id: `${block.id}-doc-${docField.id}`,
          title: block.title,
          fields: [docField],
        },
        documentField: docField,
      });
    }
  }

  return steps;
}
