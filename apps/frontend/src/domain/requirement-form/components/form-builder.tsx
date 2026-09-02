'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@repo/ui';
import { AlertTriangle, Save, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { usePathname, useRouter } from '@/i18n/navigation';
import { updateForm } from '../actions';
import { FormBuilderAddBlockDialog } from './form-builder-add-block-dialog';
import { FormBuilderBlockList } from './form-builder-block-list';
import { FormBuilderEmptyState } from './form-builder-empty-state';
import { FormBuilderPreview } from './form-builder-preview';
import {
  appendBlockRef,
  type BuilderBlockRef,
  canSave,
  moveBlockRef,
  removeBlockRef,
} from './form-builder-state';

interface FormBuilderProps {
  form: RequirementForm;
  availableBlocks: FormBlock[];
  orgUId: string;
}

function normalizeBlockRefs(
  refs: readonly BuilderBlockRef[],
): BuilderBlockRef[] {
  return [...refs].sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0));
}

function blockRefsEqual(
  a: readonly BuilderBlockRef[],
  b: readonly BuilderBlockRef[],
): boolean {
  const sortedA = normalizeBlockRefs(a);
  const sortedB = normalizeBlockRefs(b);
  if (sortedA.length !== sortedB.length) return false;
  for (let i = 0; i < sortedA.length; i++) {
    const refA = sortedA[i];
    const refB = sortedB[i];
    if (!refA || !refB) return false;
    if (refA.blockId !== refB.blockId) return false;
    if ((refA.fieldOrder ?? 0) !== (refB.fieldOrder ?? 0)) return false;
  }
  return true;
}

export function FormBuilder({
  form,
  availableBlocks,
  orgUId,
}: FormBuilderProps) {
  const router = useRouter();
  const t = useTranslations('RequirementForm.builder');
  const tCommon = useTranslations('Common');
  const tActions = useTranslations('RequirementForm.actions');
  const [blockRefs, setBlockRefs] = useState<BuilderBlockRef[]>(
    form.blockRefs
      ?.slice()
      .sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0)) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { open: openBlockSheet } = useSheetTrigger('block-form');
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const hasSubmissions = (form.submissionCount ?? 0) > 0;
  const usedBlockIds = useMemo(
    () => new Set(blockRefs.map((ref) => ref.blockId)),
    [blockRefs],
  );
  const isDirty = useMemo(
    () => !blockRefsEqual(blockRefs, form.blockRefs ?? []),
    [blockRefs, form.blockRefs],
  );

  // Warn when closing the tab or refreshing with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // A block created via the block sheet (opened with forForm=true) comes
  // back as the addBlock search param — append it to the form.
  useEffect(() => {
    const newBlockId = searchParams.get('addBlock');
    if (!newBlockId) return;
    setBlockRefs((refs) => appendBlockRef(refs, newBlockId, form.id));
    const next = new URLSearchParams(searchParams.toString());
    next.delete('addBlock');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  }, [searchParams, router, pathname, form.id]);

  function handleAddExistingBlock(blockId: string) {
    setBlockRefs((refs) => appendBlockRef(refs, blockId, form.id));
    setAddBlockOpen(false);
  }

  function handleLeave() {
    setShowLeaveDialog(false);
    router.push(`/admin/${orgUId}/requirement-forms`);
  }

  function handleCancel() {
    if (isDirty) {
      setShowLeaveDialog(true);
    } else {
      router.push(`/admin/${orgUId}/requirement-forms`);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateForm({
        organizationUnitId: orgUId,
        formId: form.id,
        blockRefs: blockRefs.map((ref) => ({
          blockId: ref.blockId,
          order: ref.fieldOrder,
          required: ref.required ?? undefined,
        })),
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        toast.success(tActions('formSaved'));
        router.refresh();
      } else {
        toast.error(tActions('failedToSaveForm'));
      }
    } catch {
      toast.error(tActions('failedToSaveForm'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <div className="space-y-4 lg:col-span-2 lg:min-h-0 lg:overflow-y-auto">
          {hasSubmissions && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{t('submissionsWarning')}</p>
                <p className="text-sm text-amber-800">
                  {t('submissionsWarningDescription')}
                </p>
              </div>
            </div>
          )}

          {blockRefs.length === 0 && !hasSubmissions ? (
            <FormBuilderEmptyState onAddBlock={() => setAddBlockOpen(true)} />
          ) : (
            <FormBuilderBlockList
              blockRefs={blockRefs}
              availableBlocks={availableBlocks}
              hasSubmissions={hasSubmissions}
              onMove={(index, direction) =>
                setBlockRefs((refs) => moveBlockRef(refs, index, direction))
              }
              onRemove={(index) =>
                setBlockRefs((refs) => removeBlockRef(refs, index))
              }
              onEditBlock={(block) =>
                openBlockSheet({
                  id: block.id,
                  ...(hasSubmissions && { readOnly: 'true' }),
                })
              }
              onAddBlock={() => setAddBlockOpen(true)}
            />
          )}

          {!hasSubmissions && (
            <FormBuilderAddBlockDialog
              open={addBlockOpen}
              onOpenChange={setAddBlockOpen}
              availableBlocks={availableBlocks}
              usedBlockIds={usedBlockIds}
              onSelectBlock={handleAddExistingBlock}
              onCreateNew={() => {
                setAddBlockOpen(false);
                openBlockSheet({ forForm: 'true' });
              }}
            />
          )}
        </div>

        <FormBuilderPreview
          blockRefs={blockRefs}
          availableBlocks={availableBlocks}
        />
      </div>

      {!hasSubmissions && (
        <div className="flex flex-col items-end gap-2 lg:shrink-0">
          {!canSave(blockRefs, hasSubmissions) && (
            <p className="text-sm text-muted-foreground">
              {t('saveDisabledHint')}
            </p>
          )}
          <div className="flex items-center gap-4">
            <Button size="lg" variant="outline" onClick={handleCancel}>
              <X />
              {tCommon('cancel')}
            </Button>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={saving || !canSave(blockRefs, hasSubmissions)}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? t('saving') : t('saveForm')}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unsavedChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('unsavedChangesDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('unsavedChangesStay')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} variant="destructive">
              {t('unsavedChangesLeave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
