'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  getShiftTypeLabel,
  getShiftTypeRate,
  PAUSCHALE_TYPES,
  ShiftTypeIcon,
  type ShiftTypeValue,
} from '../shift-type';

export type { ShiftTypeValue };

interface ShiftTypeSelectProps {
  value: ShiftTypeValue;
  onChange: (value: ShiftTypeValue) => void;
  disabled?: boolean;
}

export function ShiftTypeSelect({
  value,
  onChange,
  disabled = false,
}: ShiftTypeSelectProps) {
  const t = useTranslations('Shift.form');
  const tRates = useTranslations('Accounting.settings.rates');

  const messages = {
    nonPaid: t('shiftTypeNonPaid'),
    epLabel: tRates('epLabel'),
    ulLabel: tRates('ulLabel'),
  };

  const row = (type: ShiftTypeValue) => {
    const rate = getShiftTypeRate(type);
    return (
      <div className="flex w-full items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <ShiftTypeIcon type={type} size={16} className="shrink-0" />
          <span className="text-base truncate">
            {getShiftTypeLabel(type, messages)}
          </span>
        </div>
        {rate !== undefined && (
          <span className="shrink-0 pl-2 text-sm text-muted-foreground">
            {rate.toFixed(2)} {tRates('rateUnit')}
          </span>
        )}
      </div>
    );
  };

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ShiftTypeValue)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{row(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="non-paid">{row('non-paid')}</SelectItem>
        {PAUSCHALE_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {row(type)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
