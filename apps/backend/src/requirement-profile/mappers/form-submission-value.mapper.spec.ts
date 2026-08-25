import type { FormSubmissionValueEntity } from '../schemas/form-submission-value.schema';
import { FormSubmissionValueMapper } from './form-submission-value.mapper';

describe('FormSubmissionValueMapper', () => {
  const mapper = new FormSubmissionValueMapper();

  const base: FormSubmissionValueEntity = {
    id: 'value-1',
    submissionId: 'submission-1',
    fieldId: 'field-1',
    blockId: 'block-1',
    value: 'a',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('keeps plain string values unchanged', () => {
    const model = mapper.toModel({ ...base, value: 'hello' });
    expect(model?.value).toBe('hello');
  });

  it('serializes multi-select array values as JSON', () => {
    // MULTI_CHOICE values are stored as a jsonb array (see parseValue in
    // FormSubmissionService) while the GraphQL model declares value: String.
    const model = mapper.toModel({ ...base, value: ['a', 'b'] });
    expect(model?.value).toBe('["a","b"]');
  });

  it('preserves array members containing commas', () => {
    const model = mapper.toModel({ ...base, value: ['a, b', 'c'] });
    expect(JSON.parse(model?.value ?? '')).toEqual(['a, b', 'c']);
  });

  it('returns null for missing entities', () => {
    expect(mapper.toModel(null)).toBeNull();
  });
});
