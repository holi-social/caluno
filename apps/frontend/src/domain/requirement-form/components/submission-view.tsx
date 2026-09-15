import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { getTranslations } from 'next-intl/server';
import { getFormatting } from '@/lib/formatting/formatting-server';
import type {
  SubmissionField,
  SubmissionValue,
} from '../lib/resolve-field-answer';
import { resolveSubmissionFieldAnswers } from '../lib/resolve-submission-field-answers';

export const SubmissionView = async ({
  fields,
  submissionValues,
  profileData = {},
}: {
  fields: SubmissionField[];
  submissionValues: SubmissionValue[];
  profileData?: Record<string, unknown>;
}) => {
  const t = await getTranslations('RequirementForm.submission');
  const tCommon = await getTranslations('Common');
  const { formatDate } = await getFormatting();

  const fieldAnswers = resolveSubmissionFieldAnswers(
    fields,
    submissionValues,
    profileData,
    {
      dash: tCommon('dash'),
      accepted: t('accepted'),
      formatDate,
    },
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">{t('fieldColumn')}</TableHead>
            <TableHead>{t('answerColumn')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fieldAnswers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                {t('noFields')}
              </TableCell>
            </TableRow>
          ) : (
            fieldAnswers.map(({ field, answer }) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>{answer}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
