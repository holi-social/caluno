import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { listSubmissionsByForm } from '@/lib/store-submissions';
import { getFormConfig } from '@/lib/store-configs';
import { getBlocksByIds } from '@/lib/store-blocks';
import { resolveBlockRefs } from '@/lib/resolve-blocks';
import { redirect } from 'next/navigation';
import { formatDateTime, formatSubmissionValue } from '@/lib/formatting';
import { BackHeader } from '@/components/v1/back-header';

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}) {
  const { formSlug } = await params;
  const [config, submissions] = await Promise.all([
    getFormConfig(formSlug),
    listSubmissionsByForm(formSlug),
  ]);

  if (!config) {
    redirect('/v1');
  }

  // Resolve blocks to get field labels
  const blockIds = config.blockRefs.map((r) => r.blockId);
  const blocks = await getBlocksByIds(blockIds);
  const resolved = resolveBlockRefs(config.blockRefs, blocks);
  const allFields = resolved.flatMap((b) => b.fields);

  return (
    <div className="min-h-screen bg-muted/30">
      <BackHeader
        maxWidth="max-w-6xl"
        eyebrow={config.organizationName}
        title={`Einreichungen: ${config.name}`}
        subtitle={`${submissions.length} Einreichung${submissions.length !== 1 ? 'en' : ''}`}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {submissions.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Einreichungen fuer dieses Formular.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  {allFields.map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
                  <TableHead>Eingereicht am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    {allFields.map((field) => (
                      <TableCell key={field.id} className="text-sm">
                        {formatSubmissionValue(sub.data[field.id])}
                      </TableCell>
                    ))}
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {formatDateTime(sub.submittedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
