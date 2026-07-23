'use client';

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

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

type Granularity = 'month' | 'year';

function parseValue(value: string): {
  granularity: Granularity;
  year: number;
  month: number | null;
} {
  const monthMatch = value.match(/^(\d{2})\/(\d{4})$/);
  if (monthMatch) {
    return {
      granularity: 'month',
      year: Number(monthMatch[2]),
      month: Number(monthMatch[1]) - 1,
    };
  }
  const yearMatch = value.match(/^(\d{4})$/);
  if (yearMatch) {
    return { granularity: 'year', year: Number(yearMatch[1]), month: null };
  }
  return { granularity: 'year', year: new Date().getFullYear(), month: null };
}

function formatValue(value: string): string | null {
  const { granularity, year, month } = parseValue(value);
  if (granularity === 'year' && value) return String(year);
  if (month !== null) return `${MONTH_NAMES_FULL_DE[month]} ${year}`;
  return null;
}

interface TemplateBuilderMonthYearPickerProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function TemplateBuilderMonthYearPicker({
  value,
  placeholder,
  onChange,
}: TemplateBuilderMonthYearPickerProps) {
  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>(
    parsed.granularity,
  );
  const [viewYear, setViewYear] = useState(parsed.year);
  // First cell of the year grid — starts one year back from the selected/current year,
  // not an arbitrary floor(year/12) block.
  const [yearRangeStart, setYearRangeStart] = useState(parsed.year - 1);

  const displayValue = formatValue(value);

  function selectMonth(monthIndex: number) {
    onChange(`${String(monthIndex + 1).padStart(2, '0')}/${viewYear}`);
    setOpen(false);
  }

  function selectYear(year: number) {
    onChange(String(year));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-64 p-3" align="start">
        <Tabs
          value={granularity}
          onValueChange={(v) => setGranularity(v as Granularity)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="year" className="flex-1">
              Jahr
            </TabsTrigger>
            <TabsTrigger value="month" className="flex-1">
              Monat
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
                aria-label="Vorheriges Jahr"
              >
                <ChevronLeftIcon size={14} aria-hidden="true" />
              </Button>
              <span className="text-sm font-medium">{viewYear}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewYear((y) => y + 1)}
                aria-label="Nächstes Jahr"
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
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setYearRangeStart((y) => y - 12)}
                aria-label="Vorheriger Zeitraum"
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
                aria-label="Nächster Zeitraum"
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
        )}
      </PopoverContent>
    </Popover>
  );
}
