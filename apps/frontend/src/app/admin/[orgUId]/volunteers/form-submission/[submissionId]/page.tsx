import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { formatDate } from '@/lib/formatting';

interface Props {
  params: Promise<{ orgUId: string; submissionId: string }>;
}

function resolveFieldAnswer(
  field: { id: string; type: string; systemKey?: string | null },
  submissionValues: { fieldId: string; value: string }[],
  profileData: Record<string, unknown>,
): string {
  const raw =
    field.systemKey && profileData[field.systemKey] !== undefined
      ? String(profileData[field.systemKey])
      : (submissionValues.find((v) => v.fieldId === field.id)?.value ?? null);

  if (!raw) {
    return '—';
  }

  if (field.type === 'DATE') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : formatDate(d);
  }
  if (field.type === 'CHECKBOX' || field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return raw === 'true' ? 'Accepted' : '—';
  }
  if (field.type === 'STATIC_TEXT') return '—';

  return raw;
}

export default async function FormSubmissionPage({ params }: Props) {
  const { orgUId, submissionId } = await params;
  const data = await getDataClient(orgUId);

  const submission =
    await data.requirementForm.findAdminSubmission(submissionId);

  if (!submission) {
    notFound();
  }

  const userProfile = submission.user?.id
    ? await data.requirementProfile.getAdminUserProfile(submission.user.id)
    : null;

  const volunteerName = submission.user?.name ?? 'Volunteer';
  const formName = submission.form?.name ?? 'Form';
  const submissionValues = (submission.values ?? []) as {
    fieldId: string;
    value: string;
  }[];
  const profileData = (userProfile?.data ?? {}) as Record<string, unknown>;

  const fields =
    submission.form?.blockRefs
      ?.slice()
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .flatMap((ref) => ref.block?.fields ?? []) ?? [];

  const displayFields = fields.filter((f) => f.type !== 'STATIC_TEXT');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{volunteerName}</h1>
        <p className="text-muted-foreground mt-1">{formName}</p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Field</TableHead>
              <TableHead>Answer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayFields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No fields defined for this form.
                </TableCell>
              </TableRow>
            ) : (
              displayFields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell>
                    {resolveFieldAnswer(field, submissionValues, profileData)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
