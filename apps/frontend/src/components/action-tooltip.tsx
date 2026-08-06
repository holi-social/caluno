'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import type { ReactElement } from 'react';

/** Hover label for icon-only actions. Keeps aria-label on the trigger for a11y. */
export function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
