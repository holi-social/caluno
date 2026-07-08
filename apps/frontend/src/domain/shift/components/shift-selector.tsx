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
import { AlertCircle, Clock } from 'lucide-react';
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
  title: string;
  actualStartsAt: string;
  actualEndsAt: string;
};

const ShiftOption = ({
  title,
  actualStartsAt,
  actualEndsAt,
}: ShiftOptionProps) => {
  const { formatTimeRange } = useFormatting();

  return (
    <div className="p-1">
      <dt className="truncate font-bold text-left">{title}</dt>
      <dl className="text-xs truncate flex items-center gap-1">
        <Clock className="size-3 shrink-0" />{' '}
        {formatTimeRange(actualStartsAt, actualEndsAt)}
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

  const selectedShift =
    shifts.length === 1 ? shifts[0] : shifts.find((s) => s.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-16!">
        <SelectValue placeholder={t('selector.chooseShift')}>
          {selectedShift && (
            <ShiftOption
              title={selectedShift.master.title}
              actualStartsAt={selectedShift.actualStartsAt}
              actualEndsAt={selectedShift.actualEndsAt}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {shifts.map((shift) => (
          <SelectItem key={shift.id} value={shift.id}>
            <ShiftOption
              title={shift.master.title}
              actualStartsAt={shift.actualStartsAt}
              actualEndsAt={shift.actualEndsAt}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
