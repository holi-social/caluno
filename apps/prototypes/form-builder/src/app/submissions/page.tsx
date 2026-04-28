import Link from 'next/link';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import { listSubmissions } from '@/lib/store-submissions';
import { listFormConfigs } from '@/lib/store-configs';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AllSubmissionsPage() {
  const [submissions, configs] = await Promise.all([
    listSubmissions(),
    listFormConfigs(),
  ]);

  const configMap = new Map(configs.map((c) => [c.slug, c]));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Alle Einreichungen</h1>
            <p className="text-muted-foreground text-sm">
              {submissions.length} Einreichung{submissions.length !== 1 && 'en'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {submissions.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Einreichungen vorhanden.
          </p>
        ) : (
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formular</TableHead>
                  <TableHead>Daten</TableHead>
                  <TableHead>Eingereicht am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const config = configMap.get(sub.formSlug);
                  const summaryEntries = Object.entries(sub.data)
                    .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
                    .slice(0, 3);

                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Link
                          href={`/submissions/${sub.formSlug}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {config?.name || sub.formSlug}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {config?.organizationName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {summaryEntries.map(([key, val]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {String(val)}
                            </Badge>
                          ))}
                          {Object.keys(sub.data).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.keys(sub.data).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(sub.submittedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
