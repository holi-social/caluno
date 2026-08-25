import { describe, expect, it } from 'bun:test';
import { FieldType } from '@repo/data';
import {
  buildFieldSchema,
  type RenderableField,
  validateIban,
} from './field-renderer';

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
  invalidIban: (l: string) => `${l} iban`,
  dateNotFuture: (l: string) => `${l} not future`,
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

describe('validateIban', () => {
  it('accepts a valid, formatted IBAN', () => {
    expect(validateIban('DE89 3704 0044 0532 0130 00')).toBe(true);
  });
  it('rejects a malformed string', () => {
    expect(validateIban('DE00XX')).toBe(false);
  });
  it('rejects a valid-format IBAN with a bad checksum', () => {
    expect(validateIban('DE89 3704 0044 0532 0130 01')).toBe(false);
  });
});

describe('buildFieldSchema IBAN', () => {
  const field = makeField({
    id: 'iban',
    type: FieldType.Iban,
    label: 'IBAN',
    systemKey: 'iban',
  });
  it('rejects an invalid IBAN', () => {
    expect(
      buildFieldSchema(field, true, msgs).safeParse('not-an-iban').success,
    ).toBe(false);
  });
  it('accepts a valid IBAN', () => {
    expect(
      buildFieldSchema(field, true, msgs).safeParse(
        'DE89 3704 0044 0532 0130 00',
      ).success,
    ).toBe(true);
  });
});

describe('buildFieldSchema birth-date', () => {
  const field = makeField({
    id: 'dob',
    type: FieldType.Date,
    label: 'Birth date',
    systemKey: 'birth-date',
  });
  it('rejects a future birth-date', () => {
    const future = new Date(Date.now() + 86_400_000 * 365).toISOString();
    expect(buildFieldSchema(field, false, msgs).safeParse(future).success).toBe(
      false,
    );
  });
  it('accepts a past birth-date', () => {
    expect(
      buildFieldSchema(field, false, msgs).safeParse('1990-01-01').success,
    ).toBe(true);
  });
});

describe('buildFieldSchema MULTI_CHOICE', () => {
  const field = makeField({
    id: 'times',
    type: FieldType.MultiChoice,
    label: 'Times',
    options: [
      { label: '10:30', value: '10:30' },
      { label: 'Morning, afternoon', value: 'Morning, afternoon' },
    ],
  });

  it('accepts a JSON-array selection', () => {
    const schema = buildFieldSchema(field, true, msgs);
    expect(schema.safeParse('["10:30"]').success).toBe(true);
  });

  it('accepts values containing commas', () => {
    const schema = buildFieldSchema(field, true, msgs);
    expect(schema.safeParse('["Morning, afternoon"]').success).toBe(true);
  });

  it('rejects unknown options', () => {
    const schema = buildFieldSchema(field, true, msgs);
    expect(schema.safeParse('["nope"]').success).toBe(false);
  });

  it('rejects an empty selection when required', () => {
    const schema = buildFieldSchema(field, true, msgs);
    expect(schema.safeParse('').success).toBe(false);
    expect(schema.safeParse('[]').success).toBe(false);
  });

  it('accepts an empty selection when optional', () => {
    const schema = buildFieldSchema(field, false, msgs);
    expect(schema.safeParse('').success).toBe(true);
  });

  it('reads the legacy comma-joined format', () => {
    const schema = buildFieldSchema(field, true, msgs);
    expect(schema.safeParse('10:30').success).toBe(true);
  });
});
