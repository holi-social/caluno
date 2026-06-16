"use client";

import type { GetTimeEntriesQuery } from "@repo/data";
import {
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import Link from "next/link";
import { formatDuration, formatTimeRange } from "../formating";
import { ActionBar } from "./action-bar";

type TimeEntry = GetTimeEntriesQuery["timeEntries"]["items"][number];

interface TimesheetsTableProps {
  entries: TimeEntry[];
  organizationUnitId: string;
}

export const TimesheetsTable = ({
  entries,
  organizationUnitId,
}: TimesheetsTableProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift</TableHead>
            <TableHead>Volunteer</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={cn({ "bg-muted/80": !entry.endedAt })}
            >
              <TableCell>
                <Link
                  className="hover:underline block"
                  href={`/admin/${organizationUnitId}/timesheets/${entry.id}`}
                >
                  {entry.shiftInstance?.master?.title ?? "N/A"}
                </Link>
              </TableCell>
              <TableCell>
                {entry.volunteer?.name ?? entry.volunteer?.email ?? "N/A"}
              </TableCell>
              <TableCell>{formatTimeRange(entry)}</TableCell>
              <TableCell>{formatDuration(entry)}</TableCell>
              <TableCell>
                <ActionBar
                  id={entry.id}
                  organizationUnitId={organizationUnitId}
                  size="xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
