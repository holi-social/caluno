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
import { AlertCircle, CalendarCheck, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';

type ShiftSelectorProps = {
  organizationUnitId: string;
  shifts: ActiveShift[];
  onChange: (shiftId: string) => void;
  value?: string;
};

type ShiftOptionProps = {
  shift: ActiveShift;
};

const ShiftOption = ({ shift }: ShiftOptionProps) => {
  const { formatTimeRange } = useFormatting();

  return (
    <div className="p-1 w-full">
      <dt className="flex items-center gap-2">
        <span className="truncate">
          {shift.overrideTitle ?? shift.master.title}
        </span>
        {shift.accepted && <CalendarCheck className="size-4 text-primary" />}
      </dt>
      <dl className="text-xs truncate flex items-center gap-1">
        <Clock className="size-3 shrink-0" />{' '}
        {formatTimeRange(shift.actualStartsAt, shift.actualEndsAt)}
      </dl>
    </div>
  );
};

export const ShiftSelector = ({
  shifts,
  organizationUnitId,
  onChange,
  value,
}: ShiftSelectorProps) => {
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

  const selectedShift = shifts.find((s) => s.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-16! [&>span]:w-full">
        <SelectValue placeholder={t('selector.chooseShift')}>
          {selectedShift && <ShiftOption shift={selectedShift} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {shifts.map((shift) => (
          <SelectItem key={shift.id} value={shift.id}>
            <ShiftOption shift={shift} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
