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
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { createForm } from '../actions';

export function CreateFormDialog({
  open,
  onOpenChange,
  orgUId,
  organizationId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUId: string;
  organizationId: string;
  onCreated?: (formId: string) => void;
}) {
  const router = useRouter();
  const t = useTranslations('RequirementForm.form');
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
        if (onCreated) {
          onCreated(result.data.id);
        } else {
          router.push(
            `/admin/${orgUId}/requirement-forms/${result.data.id}/builder`,
          );
        }
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('createDialogTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <Field>
            <FieldLabel htmlFor="form-name">{t('nameLabel')}</FieldLabel>
            <Input
              id="form-name"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-base"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="form-desc">
              {t('descriptionOptional')}
            </FieldLabel>
            <Input
              id="form-desc"
              placeholder={t('descriptionPlaceholder')}
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
              <X />
              {t('cancel')}
            </Button>
            <Button
              size="lg"
              onClick={handleCreate}
              disabled={!name.trim() || creating}
            >
              <Plus />
              {creating ? t('creating') : t('create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
