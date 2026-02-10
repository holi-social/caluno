import { notFound } from 'next/navigation';
import { UserCard } from '@/components/user-card';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface ShiftPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

const formatRange = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const isSameDay =
    fromDate.getDate() === toDate.getDate() &&
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear();

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  if (isSameDay) {
    return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatTime(toDate)}`;
  }

  return `${formatDate(fromDate)} ${formatTime(fromDate)} - ${formatDate(toDate)} ${formatTime(toDate)}`;
};

export default async function ShiftPage({ params }: ShiftPageProps) {
  const { orgSlug, id } = await params;

  const { org } = await requireOrgAccess(orgSlug);

  const data = await getDataClient(org.id);
  const shift = await data.shift.findById(id);

  if (!shift) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{shift.title}</h1>
        <p className="text-muted-foreground">
          {formatRange(shift.startsAt, shift.endsAt)}
        </p>
      </div>

      <div className="space-y-6">
        {shift.project && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Project
            </h2>
            <p className="text-lg">{shift.project.title}</p>
          </div>
        )}

        {shift.location && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Location
            </h2>
            <p className="text-lg">{shift.location}</p>
          </div>
        )}

        {shift.instructions && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Instructions
            </h2>
            <p className="whitespace-pre-wrap text-lg">{shift.instructions}</p>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Shift Status
          </h2>
          <p className="text-lg">
            {shift.visibility === 'ALL_MEMBERS' ? 'Open' : 'Closed'} Shift
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Invited Volunteers ({shift.volunteers?.length ?? 0})
          </h2>
          {shift.volunteers && shift.volunteers.length > 0 ? (
            <div className="space-y-2">
              {shift.volunteers.map((volunteer) => (
                <UserCard key={volunteer.id} member={volunteer} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No volunteers invited.</p>
          )}
        </div>
      </div>
    </div>
  );
}
