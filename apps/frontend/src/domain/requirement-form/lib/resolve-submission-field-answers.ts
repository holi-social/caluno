import {
  type ResolveFieldAnswerOptions,
  resolveFieldAnswer,
  type SubmissionField,
  type SubmissionValue,
} from './resolve-field-answer';

export type SubmissionFieldAnswer = {
  field: SubmissionField;
  answer: string;
};

export function resolveSubmissionFieldAnswers(
  fields: SubmissionField[],
  submissionValues: SubmissionValue[],
  profileData: Record<string, unknown>,
  options: ResolveFieldAnswerOptions,
): SubmissionFieldAnswer[] {
  return fields
    .filter((field) => field.type !== 'STATIC_TEXT')
    .map((field) => ({
      field,
      answer: resolveFieldAnswer(field, submissionValues, profileData, options),
    }));
}
