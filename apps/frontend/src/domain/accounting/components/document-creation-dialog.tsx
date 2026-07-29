'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@repo/ui';
import type { ReactNode } from 'react';

export type DocumentCreationLoadStatus = 'loading' | 'loaded' | 'error';

interface DocumentCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  status: DocumentCreationLoadStatus;
  errorTitle: string;
  errorDescription: string;
  /** Rendered on the left once `status === 'loaded'`. */
  preview: ReactNode;
  /** Rendered on the right once `status === 'loaded'`. */
  fields: ReactNode;
  /** Keys for the right-column skeleton stack shown while `status === 'loading'`. */
  fieldsSkeletonKeys: string[];
  cancelLabel: string;
  sendLabel: string;
  sendingLabel: string;
  isSending: boolean;
  onSend: () => void;
  sendDisabled?: boolean;
}

/**
 * Shared shell for the Contract/Invoice creation modals: dialog chrome,
 * loading/error states, and the preview/fields two-column layout. Callers own
 * their own data loading and send flow; this only unifies the surrounding
 * structure so both documents stay in visual lockstep (see DESIGN.md, "Same
 * job, same shape").
 */
export function DocumentCreationDialog({
  open,
  onOpenChange,
  title,
  status,
  errorTitle,
  errorDescription,
  preview,
  fields,
  fieldsSkeletonKeys,
  cancelLabel,
  sendLabel,
  sendingLabel,
  isSending,
  onSend,
  sendDisabled = false,
}: DocumentCreationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {status === 'error' ? (
            <Alert variant="destructive">
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{errorDescription}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
              <div>
                {status === 'loading' ? (
                  <Skeleton className="h-96 w-full rounded-xl" />
                ) : (
                  preview
                )}
              </div>

              <div className="space-y-4">
                {status === 'loading' &&
                  fieldsSkeletonKeys.map((key) => (
                    <Skeleton key={key} className="h-24 w-full rounded-xl" />
                  ))}
                {status === 'loaded' && fields}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onSend}
            disabled={status !== 'loaded' || isSending || sendDisabled}
          >
            {isSending ? sendingLabel : sendLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
