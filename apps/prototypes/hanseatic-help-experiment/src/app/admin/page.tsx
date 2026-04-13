import { redirect } from 'next/navigation';
import { getAdminSession, isAdminSessionConfigured } from '@/lib/admin-iron-session';
import { listEntries } from '@/lib/store';
import type { Entry } from '@/lib/types';
import { AdminLogoutButton } from './logout-button';

function formatEuropeanDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTimes(e: Entry): string {
  const parts: string[] = [];
  if (e.arrivalTime) parts.push(`arrival ${e.arrivalTime}`);
  if (e.breakArrivalTime || e.breakDepartureTime) {
    parts.push(`break ${e.breakArrivalTime ?? '—'}–${e.breakDepartureTime ?? '—'}`);
  }
  return parts.length ? parts.join(' · ') : '—';
}

export default async function AdminPage() {
  if (!isAdminSessionConfigured()) {
    redirect('/admin/login');
  }
  const session = await getAdminSession();
  if (!session.isLoggedIn) {
    redirect('/admin/login');
  }

  const entries = await listEntries();

  return (
    <main className="min-h-dvh bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Entries</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submissions from the volunteer form ({entries.length} total).
            </p>
          </div>
          <AdminLogoutButton />
        </header>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium whitespace-nowrap">Planned h</th>
                <th className="p-3 font-medium min-w-[140px]">Times</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium whitespace-nowrap">GDPR</th>
                <th className="p-3 font-medium whitespace-nowrap">Created</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="p-3 max-w-[160px] truncate" title={e.name}>
                      {e.name ?? '—'}
                    </td>
                    <td className="p-3 max-w-[200px] truncate" title={e.email}>
                      {e.email ?? '—'}
                    </td>
                    <td className="p-3 tabular-nums">
                      {e.plannedDurationHours ?? '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatTimes(e)}</td>
                    <td className="p-3">{e.action}</td>
                    <td className="p-3">{e.gdprConsent === true ? 'yes' : e.gdprConsent === false ? 'no' : '—'}</td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {formatEuropeanDateTime(e.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
