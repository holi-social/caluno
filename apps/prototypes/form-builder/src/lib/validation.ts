import type { FieldError, FormField } from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-().]{6,20}$/;
const PLZ_REGEX = /^\d{4,5}$/;
const IBAN_REGEX = /^[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,2}$/i;

export function validateStepFields(
  fields: FormField[],
  data: Record<string, string | boolean | string[]>,
): FieldError[] {
  const errors: FieldError[] = [];

  for (const field of fields) {
    const value = data[field.id];

    if (field.required) {
      if (
        field.type === 'checkbox' ||
        field.type === 'document-acknowledgement'
      ) {
        if (value !== true) {
          errors.push({
            fieldId: field.id,
            message: 'Dieses Feld ist erforderlich.',
          });
        }
      } else if (field.type === 'multichoice') {
        if (!Array.isArray(value) || value.length === 0) {
          errors.push({
            fieldId: field.id,
            message: 'Bitte wählen Sie mindestens eine Option.',
          });
        }
      } else if (typeof value !== 'string' || value.trim() === '') {
        errors.push({
          fieldId: field.id,
          message: 'Dieses Feld ist erforderlich.',
        });
      }
    }

    if (typeof value === 'string' && value.trim() !== '') {
      if (field.type === 'email' && !EMAIL_REGEX.test(value)) {
        errors.push({
          fieldId: field.id,
          message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.',
        });
      }

      if (field.type === 'phone' && !PHONE_REGEX.test(value)) {
        errors.push({
          fieldId: field.id,
          message: 'Bitte geben Sie eine gueltige Telefonnummer ein.',
        });
      }

      if (field.type === 'plz' && !PLZ_REGEX.test(value)) {
        errors.push({
          fieldId: field.id,
          message: 'Bitte geben Sie eine gueltige Postleitzahl ein (4-5 Ziffern).',
        });
      }

      if (field.type === 'iban' && !IBAN_REGEX.test(value.replace(/\s/g, ''))) {
        errors.push({
          fieldId: field.id,
          message: 'Bitte geben Sie eine gueltige IBAN ein (z.B. DE89 3704 0044 0532 0130 00).',
        });
      }

      if (field.type === 'numbers' && !/^\d+$/.test(value.trim())) {
        errors.push({
          fieldId: field.id,
          message: 'Bitte geben Sie nur Zahlen ein.',
        });
      }

      if (field.type === 'date' && field.minAge) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < field.minAge) {
          errors.push({
            fieldId: field.id,
            message: `Sie muessen mindestens ${field.minAge} Jahre alt sein.`,
          });
        }
      }
    }
  }

  return errors;
}
