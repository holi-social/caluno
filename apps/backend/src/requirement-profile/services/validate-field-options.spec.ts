import { BadRequestGraphQLError } from '../../graphql/errors';
import { FieldType } from '../enums';
import { assertValidFieldOptions } from './validate-field-options';

describe('assertValidFieldOptions', () => {
  it('throws for a MULTI_CHOICE option with an empty value', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.MULTI_CHOICE, [
        { label: '10:30', value: '' },
      ]),
    ).toThrow(BadRequestGraphQLError);
  });

  it('throws for a SINGLE_CHOICE option with a blank value', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.SINGLE_CHOICE, [
        { label: 'Morning', value: '   ' },
      ]),
    ).toThrow(BadRequestGraphQLError);
  });

  it('throws for an option with an empty label', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.MULTI_CHOICE, [
        { label: '', value: 'morning' },
      ]),
    ).toThrow(BadRequestGraphQLError);
  });

  it('accepts valid options', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.MULTI_CHOICE, [
        { label: '10:30', value: '10:30' },
        { label: '13:00', value: '13:00' },
      ]),
    ).not.toThrow();
  });

  it('ignores non-choice field types even with empty option values', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.TEXT, [{ label: '', value: '' }]),
    ).not.toThrow();
  });

  it('ignores missing options', () => {
    expect(() =>
      assertValidFieldOptions(FieldType.MULTI_CHOICE, null),
    ).not.toThrow();
    expect(() =>
      assertValidFieldOptions(FieldType.MULTI_CHOICE, undefined),
    ).not.toThrow();
  });
});
