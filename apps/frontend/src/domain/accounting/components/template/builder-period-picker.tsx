'use client';

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

// Not imported from 'react-day-picker' — that package is a `@repo/ui`-only dependency, not a
// direct frontend one. Same local shape `period-picker.tsx` uses for the same reason.
interface PickerDateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const MONTH_NAMES_DE = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

const MONTH_NAMES_FULL_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

type Granularity = 'month' | 'year' | 'range';

interface ParsedValue {
  granularity: Granularity;
  year: number;
  month: number | null;
  rangeFrom: Date | null;
  rangeTo: Date | null;
}

function parseValue(value: string): ParsedValue {
  const rangeMatch = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s*–\s*(\d{2})\.(\d{2})\.(\d{4})$/,
  );
  if (rangeMatch) {
    const [, fromDay, fromMonth, fromYear, toDay, toMonth, toYear] = rangeMatch;
    return {
      granularity: 'range',
      year: new Date().getFullYear(),
      month: null,
      rangeFrom: new Date(
        Number(fromYear),
        Number(fromMonth) - 1,
        Number(fromDay),
      ),
      rangeTo: new Date(Number(toYear), Number(toMonth) - 1, Number(toDay)),
    };
  }
  const monthMatch = value.match(/^(\d{2})\/(\d{4})$/);
  if (monthMatch) {
    return {
      granularity: 'month',
      year: Number(monthMatch[2]),
      month: Number(monthMatch[1]) - 1,
      rangeFrom: null,
      rangeTo: null,
    };
  }
  const yearMatch = value.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      granularity: 'year',
      year: Number(yearMatch[1]),
      month: null,
      rangeFrom: null,
      rangeTo: null,
    };
  }
  return {
    granularity: 'year',
    year: new Date().getFullYear(),
    month: null,
    rangeFrom: null,
    rangeTo: null,
  };
}

function formatValue(value: string): string | null {
  const { granularity, year, month, rangeFrom, rangeTo } = parseValue(value);
  if (!value) return null;
  if (granularity === 'range' && rangeFrom && rangeTo) {
    return `${format(rangeFrom, 'dd.MM.yyyy')} – ${format(rangeTo, 'dd.MM.yyyy')}`;
  }
  if (granularity === 'year') return String(year);
  if (month !== null) return `${MONTH_NAMES_FULL_DE[month]} ${year}`;
  return null;
}

interface TemplateBuilderPeriodPickerProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function TemplateBuilderPeriodPicker({
  value,
  placeholder,
  onChange,
}: TemplateBuilderPeriodPickerProps) {
  const t = useTranslations('Accounting.templates.builder.periodPicker');
  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>(
    parsed.granularity,
  );
  const [viewYear, setViewYear] = useState(parsed.year);
  // First cell of the year grid — starts one year back from the selected/current year,
  // not an arbitrary floor(year/12) block.
  const [yearRangeStart, setYearRangeStart] = useState(parsed.year - 1);
  const [rangeDraft, setRangeDraft] = useState<PickerDateRange | undefined>(
    parsed.granularity === 'range' && parsed.rangeFrom
      ? { from: parsed.rangeFrom, to: parsed.rangeTo ?? undefined }
      : undefined,
  );

  const displayValue = formatValue(value);

  function selectMonth(monthIndex: number) {
    onChange(`${String(monthIndex + 1).padStart(2, '0')}/${viewYear}`);
    setOpen(false);
  }

  function selectYear(year: number) {
    onChange(String(year));
    setOpen(false);
  }

  function applyRange() {
    if (!rangeDraft?.from || !rangeDraft?.to) return;
    onChange(
      `${format(rangeDraft.from, 'dd.MM.yyyy')}–${format(rangeDraft.to, 'dd.MM.yyyy')}`,
    );
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setRangeDraft(
            parsed.granularity === 'range' && parsed.rangeFrom
              ? { from: parsed.rangeFrom, to: parsed.rangeTo ?? undefined }
              : undefined,
          );
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          <CalendarIcon
            size={14}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          {displayValue ?? (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={granularity === 'range' ? 'w-auto p-3' : 'w-64 p-3'}
        align="start"
      >
        <Tabs
          value={granularity}
          onValueChange={(v) => setGranularity(v as Granularity)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="year" className="flex-1">
              {t('tabYear')}
            </TabsTrigger>
            <TabsTrigger value="month" className="flex-1">
              {t('tabMonth')}
            </TabsTrigger>
            <TabsTrigger value="range" className="flex-1">
              {t('tabRange')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {granularity === 'month' ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewYear((y) => y - 1)}
                aria-label={t('previousYear')}
              >
                <ChevronLeftIcon size={14} aria-hidden="true" />
              </Button>
              <span className="text-sm font-medium">{viewYear}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewYear((y) => y + 1)}
                aria-label={t('nextYear')}
              >
                <ChevronRightIcon size={14} aria-hidden="true" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES_DE.map((name, i) => (
                <Button
                  key={name}
                  type="button"
                  size="sm"
                  variant={
                    parsed.granularity === 'month' &&
                    parsed.year === viewYear &&
                    parsed.month === i
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => selectMonth(i)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        ) : granularity === 'year' ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setYearRangeStart((y) => y - 12)}
                aria-label={t('previousYearBlock')}
              >
                <ChevronLeftIcon size={14} aria-hidden="true" />
              </Button>
              <span className="text-sm font-medium">
                {yearRangeStart}–{yearRangeStart + 11}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setYearRangeStart((y) => y + 12)}
                aria-label={t('nextYearBlock')}
              >
                <ChevronRightIcon size={14} aria-hidden="true" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(
                (year) => (
                  <Button
                    key={year}
                    type="button"
                    size="sm"
                    variant={
                      parsed.granularity === 'year' && parsed.year === year
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => selectYear(year)}
                  >
                    {year}
                  </Button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <Calendar
              mode="range"
              defaultMonth={rangeDraft?.from ?? undefined}
              selected={rangeDraft}
              onSelect={setRangeDraft}
              numberOfMonths={2}
            />
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={!rangeDraft?.from || !rangeDraft?.to}
              onClick={applyRange}
            >
              {t('apply')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
