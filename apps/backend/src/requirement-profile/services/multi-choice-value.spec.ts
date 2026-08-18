import { parseMultiChoiceValue } from './multi-choice-value';

describe('parseMultiChoiceValue', () => {
  it('parses a JSON-array selection', () => {
    expect(parseMultiChoiceValue('["10:30","13:00"]')).toEqual([
      '10:30',
      '13:00',
    ]);
  });

  it('preserves values containing commas', () => {
    expect(parseMultiChoiceValue('["Morning, afternoon"]')).toEqual([
      'Morning, afternoon',
    ]);
  });

  it('parses an empty string as no selection', () => {
    expect(parseMultiChoiceValue('')).toEqual([]);
  });

  it('parses an empty array as no selection', () => {
    expect(parseMultiChoiceValue('[]')).toEqual([]);
  });

  it('reads the legacy comma-joined format', () => {
    expect(parseMultiChoiceValue('10:30,13:00')).toEqual(['10:30', '13:00']);
  });

  it('falls back to comma-split for non-array JSON', () => {
    expect(parseMultiChoiceValue('123')).toEqual(['123']);
  });

  it('drops non-string members', () => {
    expect(parseMultiChoiceValue('["a",1,"b"]')).toEqual(['a', 'b']);
  });
});
