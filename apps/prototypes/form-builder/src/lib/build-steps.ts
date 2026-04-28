import type { FormSection, FormField } from './types';

export type DisplayStep = {
  section: FormSection;
  documentField?: FormField;
};

export function buildDisplaySteps(sections: FormSection[]): DisplayStep[] {
  const steps: DisplayStep[] = [];

  for (const section of sections) {
    const docFields = section.fields.filter(
      (f) => f.type === 'document-acknowledgement',
    );
    const nonDocFields = section.fields.filter(
      (f) => f.type !== 'document-acknowledgement',
    );

    if (nonDocFields.length > 0) {
      steps.push({
        section: { ...section, fields: nonDocFields },
      });
    }

    for (const docField of docFields) {
      steps.push({
        section: {
          ...section,
          id: `${section.id}-doc-${docField.id}`,
          title: docField.label,
          description:
            docField.documentLabel ||
            'Bitte lesen und bestaetigen Sie das Dokument.',
          fields: [docField],
        },
        documentField: docField,
      });
    }
  }

  return steps;
}
