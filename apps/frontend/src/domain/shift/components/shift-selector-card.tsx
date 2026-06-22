'use client';

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
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
  const t = useTranslations('Shift');

  if (shifts.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{t('selector.noActiveShifts')}</AlertTitle>
        <AlertDescription>
          {t.rich('selector.noActiveShiftsDescription', {
            addShift: (chunks) => (
              <Link href="?sheet=shift-form" className="underline">
                {chunks}
              </Link>
            ),
            existingShift: (chunks) => (
              <Link
                href={`/admin/${organizationUnitId}/shifts`}
                className="underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </AlertDescription>
      </Alert>
    );
  }

  if (shifts.length === 1) {
    const shift = shifts[0];
    return (
      shift && (
        <MiniShiftCard
          title={shift.master.title}
          actualStartsAt={shift.actualStartsAt}
          actualEndsAt={shift.actualEndsAt}
        />
      )
    );
  }

  const selectedShift = shifts.find((s) => s.id === value);

  return (
    <div className="space-y-4">
      <Select value="" onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selector.chooseShift')} />
        </SelectTrigger>
        <SelectContent>
          {shifts.map((shift) => (
            <SelectItem key={shift.id} value={shift.id}>
              <MiniShiftCard
                title={shift.master.title}
                actualStartsAt={shift.actualStartsAt}
                actualEndsAt={shift.actualEndsAt}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedShift && (
        <MiniShiftCard
          title={selectedShift.master.title}
          actualStartsAt={selectedShift.actualStartsAt}
          actualEndsAt={selectedShift.actualEndsAt}
        />
      )}
    </div>
  );
};
