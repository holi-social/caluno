import type { GetShiftsQuery } from '@repo/data';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { formatRange } from '@/lib/formatting';

type ShiftListItem = GetShiftsQuery['shifts']['items'][number];

interface ShiftsTableProps {
  shifts: ShiftListItem[];
  orgSlug: string;
}

const visibilityConfig = {
  ALL_MEMBERS: { variant: 'outline' as const, label: 'Open shift' },
  INVITED_MEMBERS: { variant: 'secondary' as const, label: 'Invite only' },
};

export function ShiftsTable({ shifts }: ShiftsTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">Name</TableHead>
            <TableHead className="text-muted-foreground">Project</TableHead>
            <TableHead className="text-muted-foreground">Volunteers</TableHead>
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Visibility</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id} className="hover:bg-muted/50">
              <TableCell>{shift.title}</TableCell>
              <TableCell className="text-muted-foreground">
                {shift.project?.title ?? '-'}
              </TableCell>
              <TableCell>
                {shift.volunteers?.slice(0, 3).map((u) => (
                  <div key={u.id}>{u.name}</div>
                ))}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRange(shift.startsAt, shift.endsAt)}
              </TableCell>
              <TableCell>
                <Badge variant={visibilityConfig[shift.visibility].variant}>
                  {visibilityConfig[shift.visibility].label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
