import type { ActiveShift } from '@repo/data';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { MiniShiftCard } from './mini-shift-card';

type ShiftSelectorCardProps = {
  organizationUnitId: string;
  shifts: ActiveShift[];
  onChange: (shiftId: string) => void;
  value?: string;
};

export const ShiftSelectorCard = ({
  shifts,
  organizationUnitId,
  onChange,
  value,
}: ShiftSelectorCardProps) => {
  if (shifts.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>No active shifts</AlertTitle>
        <AlertDescription>
          <span>
            Please{' '}
            <Link href={`/${organizationUnitId}/shifts/new`} className="underline">
              add a shift
            </Link>{' '}
            or adjust the time-range of an{' '}
            <Link href={`/${organizationUnitId}/shifts`} className="underline">
              existing shift.
            </Link>
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (shifts.length === 1) {
    const shift = shifts[0];
    return shift && <MiniShiftCard {...shift} />;
  }

  const selectedShift = shifts.find((s) => s.id === value);

  return (
    <div className="space-y-4">
      <Select value="" onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a shift" />
        </SelectTrigger>
        <SelectContent>
          {shifts.map((shift) => (
            <SelectItem key={shift.id} value={shift.id}>
              <MiniShiftCard {...shift} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedShift && <MiniShiftCard {...selectedShift} />}
    </div>
  );
};
