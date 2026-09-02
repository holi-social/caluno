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
import {
  resolveFieldAnswer,
  type SubmissionField,
  type SubmissionValue,
} from '../lib/resolve-field-answer';

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

  const displayFields = fields.filter((f) => f.type !== 'STATIC_TEXT');

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
          {displayFields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                {t('noFields')}
              </TableCell>
            </TableRow>
          ) : (
            displayFields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>
                  {resolveFieldAnswer(field, submissionValues, profileData, {
                    dash: tCommon('dash'),
                    accepted: t('accepted'),
                    formatDate,
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
