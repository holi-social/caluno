import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@repo/ui';
import { listSubmissions } from '@/lib/store-submissions';
import { listFormConfigs } from '@/lib/store-configs';
import { formatDateTime } from '@/lib/formatting';
import { BackHeader } from '@/components/back-header';

export default async function AllSubmissionsPage() {
  const [submissions, configs] = await Promise.all([
    listSubmissions(),
    listFormConfigs(),
  ]);

  const configMap = new Map(configs.map((c) => [c.slug, c]));

  return (
    <div className="min-h-screen bg-muted/30">
      <BackHeader
        title="Alle Einreichungen"
        subtitle={`${submissions.length} Einreichung${submissions.length !== 1 ? 'en' : ''}`}
      />

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
