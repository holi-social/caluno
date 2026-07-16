'use client';

import {
  PermissionKey,
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
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
} from '@repo/ui';
import { Check, FileText, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateFormDialog } from '@/domain/requirement-form/components/create-form-dialog';

interface RequiredFormsPopoverProps {
  orgUId: string;
}

export function RequiredFormsPopover({ orgUId }: RequiredFormsPopoverProps) {
  const t = useTranslations('Volunteer.requiredForms');
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

  const _handleCreated = async (formId: string) => {
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
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="required-forms-toggle"
                  className="text-sm font-medium"
                >
                  {t('toggleLabel')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('toggleDescription')}
                </p>
              </div>
              <Switch
                id="required-forms-toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={setRequiredFormsEnabled.isPending}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('attachedFormsLabel')}
              </p>
              {requiredForms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('noFormsAttached')}
                </p>
              ) : (
                <div className="space-y-2">
                  {requiredForms.map((ref) => (
                    <div
                      key={ref.form.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {ref.form.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('questionCount', {
                              count: ref.form.blockRefs?.length ?? 0,
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemove(ref.form.id)}
                        disabled={setRequiredForms.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
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
                            <Check
                              className={`mr-2 h-4 w-4 ${attachedFormIds.has(form.id) ? 'opacity-100' : 'opacity-0'}`}
                            />
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
                className="w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('createNew')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{t('dedupHint')}</p>
          </div>
        </PopoverContent>
      </Popover>

      <CreateFormDialog
        open={createDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setCreateDialogOpen(false);
        }}
        orgUId={orgUId}
        organizationId={orgUnit?.organizationId ?? ''}
      />
    </>
  );
}
