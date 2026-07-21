'use client';

import { FieldType } from '@repo/data';
import {
  PermissionKey,
  type RequiredForm,
  useHasPermission,
  useOrganizationUnitWithSuspense,
  useRequirementForms,
  useSetRequiredForms,
  useSetRequiredFormsEnabled,
} from '@repo/data/react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@repo/ui';
import { FileCheck, FilePlus, FileText, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateFormDialog } from '@/domain/requirement-form/components/create-form-dialog';

interface RequiredFormsPopoverProps {
  orgUId: string;
}

function formHasFileUpload(form: RequiredForm): boolean {
  return (
    form.blockRefs?.some((ref) =>
      ref.block?.fields?.some(
        (field) => field.type === FieldType.DocumentAcknowledgement,
      ),
    ) ?? false
  );
}

export function RequiredFormsPopover({ orgUId }: RequiredFormsPopoverProps) {
  const t = useTranslations('Volunteer.requiredForms');
  const commonT = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const canConfigure = useHasPermission([
    PermissionKey.OrgEdit,
    PermissionKey.RequirementProfileEdit,
  ]);

  const { data: orgUnit } = useOrganizationUnitWithSuspense(orgUId);
  const { data: formsData } = useRequirementForms(
    orgUnit?.organizationId ?? '',
  );

  const setRequiredForms = useSetRequiredForms();
  const setRequiredFormsEnabled = useSetRequiredFormsEnabled();

  const requiredForms = orgUnit?.requiredForms ?? [];
  const enabled = orgUnit?.requiredFormsEnabled ?? false;
  const effectiveEnabled = enabled && requiredForms.length > 0;

  const attachedFormIds = useMemo(
    () => new Set(requiredForms.map((ref) => ref.form.id)),
    [requiredForms],
  );

  const availableForms = useMemo(
    () =>
      (formsData?.items ?? []).filter((form) => !attachedFormIds.has(form.id)),
    [formsData, attachedFormIds],
  );

  const getFormDescription = (form: RequiredForm) => {
    const count = form.blockRefs?.length ?? 0;
    const hasUpload = formHasFileUpload(form);
    const questionLabel = t('questionCount', { count });
    return hasUpload
      ? `${questionLabel} · ${t('fileUploadLabel')}`
      : questionLabel;
  };

  const handleToggle = async (checked: boolean) => {
    try {
      await setRequiredFormsEnabled.mutateAsync({
        organizationUnitId: orgUId,
        enabled: checked,
      });
      toast.success(checked ? t('enabledToast') : t('disabledToast'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('toggleFailedToast'),
      );
    }
  };

  const handleRemove = async (formId: string) => {
    const nextIds = requiredForms
      .filter((ref) => ref.form.id !== formId)
      .map((ref) => ref.form.id);
    try {
      await setRequiredForms.mutateAsync({
        organizationUnitId: orgUId,
        formIds: nextIds,
      });
      toast.success(t('removedToast'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('updateFailedToast'),
      );
    }
  };

  const handleAddExisting = async (formId: string) => {
    const nextIds = [...requiredForms.map((ref) => ref.form.id), formId];
    try {
      await setRequiredForms.mutateAsync({
        organizationUnitId: orgUId,
        formIds: nextIds,
      });
      setCommandOpen(false);
      toast.success(t('addedToast'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('updateFailedToast'),
      );
    }
  };

  const handleCreated = async (formId: string) => {
    setCreateDialogOpen(false);
    const nextIds = [...requiredForms.map((ref) => ref.form.id), formId];
    try {
      await setRequiredForms.mutateAsync({
        organizationUnitId: orgUId,
        formIds: nextIds,
      });
      toast.success(t('addedToast'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('updateFailedToast'),
      );
    }
  };

  if (!canConfigure) {
    return (
      <Button variant="outline" size="sm" disabled>
        {effectiveEnabled
          ? t('pill.required', { count: requiredForms.length })
          : t('pill.none')}
      </Button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <span
              className={`mr-2 inline-flex h-2 w-2 rounded-full ${effectiveEnabled ? 'bg-green-500' : 'bg-muted-foreground'}`}
            />
            {effectiveEnabled
              ? t('pill.required', { count: requiredForms.length })
              : t('pill.none')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="end">
          <div className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">{t('title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('subtitle', {
                    brand: commonT('brand'),
                    unitName: orgUnit?.name ?? '',
                  })}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={setRequiredFormsEnabled.isPending}
                aria-label={t('toggleLabel')}
              />
            </div>

            {requiredForms.length > 0 && (
              <div className="space-y-3">
                {requiredForms.map((ref) => (
                  <div
                    key={ref.form.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {formHasFileUpload(ref.form) ? (
                        <FileCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ref.form.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFormDescription(ref.form)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemove(ref.form.id)}
                      disabled={setRequiredForms.isPending}
                      aria-label={t('removeAria', { name: ref.form.name })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-primary text-primary hover:bg-primary/5"
                  >
                    {t('addExisting')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('searchForms')} />
                    <CommandList>
                      <CommandEmpty>{t('noFormsFound')}</CommandEmpty>
                      <CommandGroup>
                        {availableForms.map((form) => (
                          <CommandItem
                            key={form.id}
                            value={form.id}
                            onSelect={() => handleAddExisting(form.id)}
                          >
                            {form.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setCreateDialogOpen(true)}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                {t('createNew')}
              </Button>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{t('dedupHint')}</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CreateFormDialog
        open={createDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setCreateDialogOpen(false);
        }}
        onCreated={handleCreated}
        orgUId={orgUId}
        organizationId={orgUnit?.organizationId ?? ''}
      />
    </>
  );
}
