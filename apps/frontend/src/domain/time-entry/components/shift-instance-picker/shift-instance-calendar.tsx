import type { ShiftInstanceItem } from '@repo/data';
import { Calendar } from '@repo/ui';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { DayButton } from './day-button';

type ShiftInstanceCalendarProps = {
  instances: ShiftInstanceItem[];
  selectedInstanceId?: string;
  onSelect: (instanceId: string) => void;
  disabled?: boolean;
};

export function ShiftInstanceCalendar({
  instances,
  selectedInstanceId,
  onSelect,
  disabled,
}: ShiftInstanceCalendarProps) {
  const instancesByDate = useMemo(
    () =>
      instances.reduce((map, i) => {
        map.set(new Date(i.actualStartsAt).toDateString(), i);
        return map;
      }, new Map<string, ShiftInstanceItem>()),
    [instances],
  );

  const monthRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const inst of instances) {
      const t = new Date(inst.actualStartsAt).getTime();
      if (t < min) min = t;
      if (t > max) max = t;
    }
    return {
      startMonth: startOfMonth(new Date(min)),
      endMonth: endOfMonth(new Date(max)),
    };
  }, [instances]);

  const selectedInstance = useMemo(() => {
    if (!selectedInstanceId) return undefined;

    return instances.find((i) => i.id === selectedInstanceId);
  }, [selectedInstanceId, instances]);

  return (
    <div className="rounded-md border p-2 w-96">
      <Calendar
        mode="single"
        className="w-full"
        selected={
          selectedInstance ? new Date(selectedInstance.actualEndsAt) : undefined
        }
        onSelect={(date) => {
          if (!date || disabled) return;
          const instance = instancesByDate.get(date.toDateString());
          if (instance) {
            onSelect(instance.id);
          }
        }}
        startMonth={monthRange.startMonth}
        endMonth={monthRange.endMonth}
        defaultMonth={
          selectedInstance
            ? new Date(selectedInstance.actualStartsAt)
            : undefined
        }
        disabled={(date) =>
          disabled || !instancesByDate.has(date.toDateString())
        }
        modifiers={{
          hasInstance: (date) => instancesByDate.has(date.toDateString()),
        }}
        showOutsideDays={false}
        components={{
          DayButton,
        }}
      />
    </div>
  );
}
