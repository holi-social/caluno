'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createForm } from '../actions';

export function CreateFormDialog({
  open,
  onOpenChange,
  orgUId,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await createForm({
        organizationUnitId: orgUId,
        organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data?.id) {
        onOpenChange(false);
        router.push(`/${orgUId}/requirement-forms/${result.data.id}/builder`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <Field>
            <FieldLabel htmlFor="form-name">Name</FieldLabel>
            <Input
              id="form-name"
              placeholder="e.g. Onboarding Form"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-base"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="form-desc">Description (optional)</FieldLabel>
            <Input
              id="form-desc"
              placeholder="What is this form for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 text-base"
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleCreate}
              disabled={!name.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
