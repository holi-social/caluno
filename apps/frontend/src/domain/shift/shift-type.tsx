import { cn } from '@repo/ui';
import { CoinsIcon, HandHeartIcon } from 'lucide-react';
import { forwardRef, type SVGProps } from 'react';
import {
  type PauschalenType,
  TYPE_COLOR,
} from '@/domain/accounting/components/doc-type-header';
import { getEffectivePauschaleRate } from '@/domain/accounting/mock-rates';

export type ShiftTypeValue = 'non-paid' | PauschalenType;

export const PAUSCHALE_TYPES: PauschalenType[] = ['ehrenamt', 'uebungleiter'];

export interface ShiftTypeMessages {
  nonPaid: string;
  epLabel: string;
  ulLabel: string;
}

export function getShiftTypeLabel(
  type: ShiftTypeValue,
  t: ShiftTypeMessages,
): string {
  if (type === 'non-paid') return t.nonPaid;
  return type === 'ehrenamt' ? t.epLabel : t.ulLabel;
}

export function getShiftTypeRate(type: ShiftTypeValue): number | undefined {
  return type === 'non-paid' ? undefined : getEffectivePauschaleRate(type);
}

interface ShiftTypeIconProps extends SVGProps<SVGSVGElement> {
  type: ShiftTypeValue;
  size?: number;
}

// forwardRef + prop spreading: Radix's `asChild` (e.g. TooltipTrigger) clones
// this element and merges its own ref + event handlers onto it directly —
// without forwarding those through, hover/focus never reaches the icon.
export const ShiftTypeIcon = forwardRef<SVGSVGElement, ShiftTypeIconProps>(
  ({ type, size, className, style, ...props }, ref) => {
    if (type === 'non-paid') {
      return (
        <HandHeartIcon
          ref={ref}
          size={size}
          className={cn('text-muted-foreground', className)}
          style={style}
          aria-hidden="true"
          {...props}
        />
      );
    }
    return (
      <CoinsIcon
        ref={ref}
        size={size}
        className={className}
        style={{ color: TYPE_COLOR[type], ...style }}
        aria-hidden="true"
        {...props}
      />
    );
  },
);
ShiftTypeIcon.displayName = 'ShiftTypeIcon';

// Mock only: shiftType isn't persisted yet (no backend field — see SF-1 to-do #5
// and the shift-type-selector design brief). Deterministic per shift id so the
// prototype shows realistic variety instead of one hardcoded value everywhere.
const MOCK_SHIFT_TYPE_OPTIONS: readonly ShiftTypeValue[] = [
  'non-paid',
  'ehrenamt',
  'uebungleiter',
];

export function getMockShiftType(shiftId: string): ShiftTypeValue {
  let hash = 0;
  for (let i = 0; i < shiftId.length; i++) {
    hash = (hash * 31 + shiftId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % MOCK_SHIFT_TYPE_OPTIONS.length;
  return MOCK_SHIFT_TYPE_OPTIONS[index] ?? 'non-paid';
}
