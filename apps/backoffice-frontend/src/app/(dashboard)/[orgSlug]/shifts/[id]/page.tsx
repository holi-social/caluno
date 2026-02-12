import { Button } from '@repo/ui';
import { Edit, Share2, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserCard } from '@/components/user-card';
import { getDataClient } from '@/lib/data-client';
import { formatRange } from '@/lib/formatting';
import { requireOrgAccess } from '@/lib/org-context-server';

interface ShiftPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

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
      <div className="flex justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{shift.title}</h1>
          <p className="text-muted-foreground">
            {formatRange(shift.startsAt, shift.endsAt)}
          </p>
        </div>
        <div className="space-x-2">
          <Button size="icon" variant="outline">
            <Link
              href={`/${orgSlug}/shifts/${id}/edit`}
              aria-label="Copy shift link to clipboard"
            >
              <Share2 className="size-4" />
            </Link>
          </Button>
          <Button size="icon" variant="outline">
            <Link
              href={`/${orgSlug}/shifts/${id}/edit`}
              aria-label="Edit shift"
            >
              <Edit className="size-4" />
            </Link>
          </Button>
          <Button size="icon" variant="destructive" aria-label="Delete shift">
            <Trash className="size-4" />
          </Button>
        </div>
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
                <UserCard key={volunteer.id} user={volunteer} size="sm" />
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
