import { describe, expect, it } from 'bun:test';
import { FieldType } from '@repo/data';
import { buildFieldSchema, type RenderableField } from './field-renderer';

const makeField = (
  o: Partial<RenderableField> & { id: string; type: FieldType; label: string },
): RenderableField => ({
  required: false,
  description: null,
  placeholder: null,
  systemKey: null,
  options: null,
  documentFileId: null,
  documentDownloadUrl: null,
  documentFilename: null,
  documentLabel: null,
  minAge: null,
  ...o,
});

const msgs = {
  fieldRequired: (l: string) => `${l} required`,
  mustBeNumber: (l: string) => `${l} number`,
  mustBeValidDate: (l: string) => `${l} date`,
  mustBeValidEmail: (l: string) => `${l} email`,
  mustBeValidPhone: (l: string) => `${l} phone`,
  invalidOptions: (l: string) => `${l} options`,
  maxChars: (l: string, m: number) => `${l} max ${m}`,
  invalidCharacters: (l: string) => `${l} chars`,
  validPostalCode: (l: string) => `${l} zip`,
  minAge: (a: number) => `min ${a}`,
};

describe('buildFieldSchema (existing behavior)', () => {
  it('rejects empty when required', () => {
    const schema = buildFieldSchema(
      makeField({
        id: 'name',
        type: FieldType.Name,
        label: 'Name',
        required: true,
        systemKey: 'name',
      }),
      true,
      msgs,
    );
    expect(schema.safeParse('').success).toBe(false);
  });

  it('accepts a value when required', () => {
    const schema = buildFieldSchema(
      makeField({
        id: 'name',
        type: FieldType.Name,
        label: 'Name',
        required: true,
        systemKey: 'name',
      }),
      true,
      msgs,
    );
    expect(schema.safeParse('Ada').success).toBe(true);
  });

  it('accepts empty when optional', () => {
    const schema = buildFieldSchema(
      makeField({
        id: 'city',
        type: FieldType.Text,
        label: 'City',
        systemKey: 'city',
      }),
      false,
      msgs,
    );
    expect(schema.safeParse('').success).toBe(true);
  });
});
