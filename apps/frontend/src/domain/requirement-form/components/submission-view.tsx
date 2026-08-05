import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { getFormatter, getTranslations } from 'next-intl/server';

type SubmissionField = {
  id: string;
  label: string;
  type: string;
  systemKey?: string | null;
  options?: { label: string; value: string }[] | null;
};

type SubmissionValue = { fieldId: string; value: string };

const resolveFieldAnswer = (
  field: SubmissionField,
  submissionValues: SubmissionValue[],
  profileData: Record<string, unknown>,
  dash: string,
  accepted: string,
  formatDate: (date: Date) => string,
): string => {
  const raw =
    field.systemKey && profileData[field.systemKey] !== undefined
      ? String(profileData[field.systemKey])
      : (submissionValues.find((v) => v.fieldId === field.id)?.value ?? null);
  if (!raw) return dash;
  if (field.type === 'DATE') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : formatDate(d);
  }
  if (field.type === 'CHECKBOX' || field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return raw === 'true' ? accepted : dash;
  }
  if (field.type === 'MULTI_CHOICE') {
    const options = field.options ?? [];
    return raw
      .split(',')
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .join(', ');
  }
  if (field.type === 'STATIC_TEXT') return dash;
  return raw;
};

export const SubmissionView = async ({
  fields,
  submissionValues,
}: {
  fields: SubmissionField[];
  submissionValues: SubmissionValue[];
}) => {
  const t = await getTranslations('MembershipDetail.submission');
  const tCommon = await getTranslations('Common');
  const format = await getFormatter();
  const formatDate = (date: Date) =>
    format.dateTime(date, { dateStyle: 'medium' });

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
          {fields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                {t('noFields')}
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>
                  {resolveFieldAnswer(
                    field,
                    submissionValues,
                    {},
                    tCommon('dash'),
                    t('accepted'),
                    formatDate,
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
