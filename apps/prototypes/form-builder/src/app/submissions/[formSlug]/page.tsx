import Link from 'next/link';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import { listSubmissionsByForm } from '@/lib/store-submissions';
import { getFormConfig } from '@/lib/store-configs';
import { redirect } from 'next/navigation';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    redirect('/');
  }

  const allFields = config.sections.flatMap((s) => s.fields);
  const fieldLabels = new Map(allFields.map((f) => [f.id, f.label]));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <p className="text-muted-foreground text-xs">
              {config.organizationName}
            </p>
            <h1 className="text-xl font-bold">
              Einreichungen: {config.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {submissions.length} Einreichung{submissions.length !== 1 && 'en'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {submissions.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Einreichungen für dieses Formular.
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
                    {allFields.map((field) => {
                      const val = sub.data[field.id];
                      let display: string;
                      if (Array.isArray(val)) {
                        display = val.length > 0 ? val.join(', ') : '-';
                      } else if (typeof val === 'boolean') {
                        display = val ? 'Ja' : 'Nein';
                      } else if (typeof val === 'string' && val.trim()) {
                        display = val;
                      } else {
                        display = '-';
                      }
                      return (
                        <TableCell key={field.id} className="text-sm">
                          {display}
                        </TableCell>
                      );
                    })}
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
