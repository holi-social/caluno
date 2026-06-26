'use client';

import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type KeyboardEvent, useId, useRef } from 'react';
import { cn } from '../lib/utils';

export type TabBarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export type TabBarIsland = {
  icon: LucideIcon;
  /** Accessible label for the icon-only button. */
  label: string;
  onClick: () => void;
  /** `left` = sidebar (backoffice mode); `right` = mode switch (volunteer mode). */
  side: 'left' | 'right';
};

export interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /**
   * At most one island. The consumer decides which (if any) based on app mode:
   * volunteer mode → `right` mode-switch island; backoffice mode → `left`
   * sidebar island. The component itself is mode-agnostic.
   */
  island?: TabBarIsland;
  className?: string;
}

/**
 * Squash-and-stretch layered on top of the travel: while in motion the pill
 * stretches along the travel axis (width +10%, height -20%), overshoots to a
 * uniform +10% on arrival, then settles back to normal.
 */
const HIGHLIGHT_SCALE_X = [1, 1.1, 1.1, 1];
const HIGHLIGHT_SCALE_Y = [1, 0.8, 1.1, 1];
const HIGHLIGHT_SCALE_TIMES = [0, 0.2, 0.85, 1];

/** Fixed per-tab width — keeps every tab equal regardless of content and lets
 * the island match a single tab's footprint exactly. */
const TAB_WIDTH = 'w-24';

/** Explicit, shared row height. Definite (not flex-stretched) so the island's
 * `aspect-square` can reliably derive its width from it and stay a circle. */
const ROW_HEIGHT = 'h-16';

function Island({ icon: Icon, label, onClick, side }: TabBarIsland) {
  // Right island (mode switch) shows its label; left island (sidebar) is
  // icon-only, with the label exposed only to assistive tech.
  const showLabel = side === 'right';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={showLabel ? undefined : label}
      className={cn(
        // Explicit height (ROW_HEIGHT) + aspect-square → a reliable circle.
        // min-w-0 stops a label from forcing it wider than the square.
        ROW_HEIGHT,
        'flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-full border border-border bg-muted px-1 text-center text-xs font-normal leading-tight text-muted-foreground shadow-md transition-all hover:bg-accent hover:shadow-lg',
      )}
    >
      <Icon className="size-6" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}

export function TabBar({
  items,
  activeKey,
  onSelect,
  island,
  className,
}: TabBarProps) {
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Per-instance id so multiple TabBars (incl. Storybook autodocs) don't share
  // one Framer shared-layout group for the highlight.
  const highlightLayoutId = useId();

  const travelTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 500, damping: 32 };
  const scaleTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: 0.4,
        times: HIGHLIGHT_SCALE_TIMES,
        ease: 'easeInOut' as const,
      };

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + items.length) % items.length;
    const nextItem = items[next];
    if (!nextItem) {
      return;
    }
    onSelect(nextItem.key);
    tabRefs.current[next]?.focus();
  }

  return (
    <nav className={cn('flex items-center gap-3 p-1', className)}>
      {island?.side === 'left' && <Island {...island} />}

      <div className="flex items-center rounded-full justify-between grow border border-border bg-muted shadow-md">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                TAB_WIDTH,
                ROW_HEIGHT,
                'relative flex flex-col items-center justify-center gap-0.5 rounded-full px-4 text-xs transition-colors',
                active
                  ? 'font-bold text-foreground'
                  : 'font-normal text-muted-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={highlightLayoutId}
                  aria-hidden
                  className="absolute inset-0 z-0 rounded-full bg-primary/40"
                  animate={{
                    scaleX: reduceMotion ? 1 : HIGHLIGHT_SCALE_X,
                    scaleY: reduceMotion ? 1 : HIGHLIGHT_SCALE_Y,
                  }}
                  transition={{
                    layout: travelTransition,
                    scaleX: scaleTransition,
                    scaleY: scaleTransition,
                  }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className="size-6" />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {island?.side === 'right' && <Island {...island} />}
    </nav>
  );
}
