import type { GetShiftsQuery } from '@repo/data';
import { formatRrulePattern } from '@repo/data';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import Link from 'next/link';
import { formatRange } from '@/lib/formatting';
import { ActionBar } from './action-bar';

type ShiftListItem = GetShiftsQuery['shifts']['items'][number];

type ShiftsTableProps = {
  shifts: ShiftListItem[];
  orgUId: string;
};

export const visibilityConfig = {
  ALL_MEMBERS: { variant: 'outline' as const, label: 'Open shift' },
  INVITED_MEMBERS: { variant: 'secondary' as const, label: 'Invite only' },
};

export function ShiftsTable({ shifts, orgUId }: ShiftsTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>First Date</TableHead>
            <TableHead>Pattern</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const startDate = new Date(shift.originalStartsAt);
            const endDate = new Date(
              startDate.getTime() + shift.durationMinutes * 60000,
            );

            return (
              <TableRow key={shift.id}>
                <TableCell>
                  <Link
                    className="hover:underline block"
                    href={`/admin/${orgUId}/shifts/${shift.id}`}
                  >
                    {shift.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRange(shift.originalStartsAt, endDate.toISOString())}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatRrulePattern(shift.rrule)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={visibilityConfig[shift.visibility].variant}>
                    {visibilityConfig[shift.visibility].label}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <ActionBar organizationUnitId={orgUId} id={shift.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
