'use client';

import { Button, Card, CardContent } from '@repo/ui';
import type { ReactNode } from 'react';

type BlockerCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  isActionPending?: boolean | undefined;
  isActionDone?: boolean | undefined;
  doneLabel?: string | undefined;
};

/**
 * Shared shell for the readiness blocker states (Figma "blocked"
 * frame). Each caller supplies its own icon, copy, and action — the card
 * itself has no state.
 */
export function BlockerCard({
  icon,
  title,
  description,
  buttonLabel,
  onAction,
  isActionPending,
  isActionDone,
  doneLabel,
}: BlockerCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isActionPending || isActionDone}
          onClick={onAction}
        >
          {isActionDone && doneLabel ? doneLabel : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
