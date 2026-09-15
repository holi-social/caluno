import { describe, expect, it } from 'bun:test';
import type { SubmissionField, SubmissionValue } from './resolve-field-answer';
import { resolveSubmissionFieldAnswers } from './resolve-submission-field-answers';

const field = (over: Partial<SubmissionField>): SubmissionField => ({
  id: 'f1',
  label: 'Field',
  type: 'TEXT',
  ...over,
});

const opts = {
  dash: '—',
  accepted: 'Accepted',
  formatDate: (d: Date) => `FMT:${d.toISOString().slice(0, 10)}`,
};

describe('resolveSubmissionFieldAnswers', () => {
  it('shows loaded profile values for system-key fields on a submitted form', () => {
    const fields = [
      field({
        id: 'f-name',
        type: 'NAME',
        label: 'Full name',
        systemKey: 'name',
      }),
      field({
        id: 'f-address',
        type: 'TEXT',
        label: 'Address',
        systemKey: 'address',
      }),
      field({ id: 'f-custom', type: 'TEXT', label: 'Motivation' }),
    ];
    const submissionValues: SubmissionValue[] = [
      { fieldId: 'f-name', value: 'Name at submission time' },
      { fieldId: 'f-address', value: 'Old street 1' },
      { fieldId: 'f-custom', value: 'Because I care' },
    ];
    const profileData = {
      name: 'Current profile name',
      address: 'Current profile address',
    };

    const answers = resolveSubmissionFieldAnswers(
      fields,
      submissionValues,
      profileData,
      opts,
    );

    expect(answers).toEqual([
      {
        field: fields[0],
        answer: 'Current profile name',
      },
      {
        field: fields[1],
        answer: 'Current profile address',
      },
      {
        field: fields[2],
        answer: 'Because I care',
      },
    ]);
  });

  it('falls back to submission values when profile data is not loaded', () => {
    const fields = [
      field({
        id: 'f-name',
        type: 'NAME',
        label: 'Full name',
        systemKey: 'name',
      }),
    ];
    const submissionValues: SubmissionValue[] = [
      { fieldId: 'f-name', value: 'Name at submission time' },
    ];

    const answers = resolveSubmissionFieldAnswers(
      fields,
      submissionValues,
      {},
      opts,
    );

    expect(answers).toEqual([
      {
        field: fields[0],
        answer: 'Name at submission time',
      },
    ]);
  });

  it('omits STATIC_TEXT fields from the submitted profile view', () => {
    const fields = [
      field({ id: 'f-info', type: 'STATIC_TEXT', label: 'Info block' }),
      field({ id: 'f-custom', type: 'TEXT', label: 'Answer' }),
    ];
    const submissionValues: SubmissionValue[] = [
      { fieldId: 'f-custom', value: 'Visible answer' },
    ];

    const answers = resolveSubmissionFieldAnswers(
      fields,
      submissionValues,
      {},
      opts,
    );

    expect(answers).toEqual([
      {
        field: fields[1],
        answer: 'Visible answer',
      },
    ]);
  });
});
