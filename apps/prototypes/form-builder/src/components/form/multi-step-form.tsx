'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type {
  Block,
  FormConfig,
  FieldError,
  FormField,
  ResolvedBlock,
} from '@/lib/types';
import { resolveBlockRefs } from '@/lib/resolve-blocks';
import { validateStepFields } from '@/lib/validation';
import { buildDisplaySteps } from '@/lib/build-steps';
import type {
  ProfileEntry,
  ProfileEntryValue,
} from '@/lib/store-user-profiles';
import type { SystemRequirementKey } from '@/lib/system-requirements';
import { StepProgress } from './step-progress';
import { FormStep } from './form-step';

type ProfileEntries = Partial<Record<SystemRequirementKey, ProfileEntry>>;
type FieldState = 'normal' | 'empty' | 'hidden' | 'profile-prefilled';

function deriveFieldState(
  field: FormField,
  entries: ProfileEntries,
  formOrg: string,
): FieldState {
  if (!field.systemKey) return 'normal';
  const entry = entries[field.systemKey as SystemRequirementKey];
  if (!entry) return 'empty';
  if (entry.subOrg === formOrg) return 'hidden';
  return 'profile-prefilled';
}

export function MultiStepForm({
  config,
  blocks,
  onSuccess,
}: {
  config: FormConfig;
  blocks: Block[];
  onSuccess: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<
    Record<string, string | boolean | string[]>
  >({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [profileEntries, setProfileEntries] = useState<ProfileEntries>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editingFieldIds, setEditingFieldIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Per-field pre-edit value so "verwerfen" can restore exactly what was
  // shown when the user opened the editor (handles both initial profile
  // values and values from a prior confirmed edit in the same session).
  const [editSnapshots, setEditSnapshots] = useState<
    Record<string, string | boolean | string[]>
  >({});

  // Fetch the volunteer's profile once on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/user-profile');
        if (!res.ok) return;
        const body = (await res.json()) as {
          userId: string | null;
          entries: ProfileEntries;
        };
        if (cancelled) return;
        setProfileEntries(body.entries ?? {});
      } catch {
        // anon / offline — treat as empty profile
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formOrg = config.organizationName;
  const resolvedBlocks = useMemo(
    () => resolveBlockRefs(config.blockRefs, blocks),
    [config.blockRefs, blocks],
  );

  // Compute every field's state once; visibleBlocks, prefill, and the
  // state-3 id-set all derive from this single map.
  const fieldStateMap = useMemo(() => {
    const map = new Map<string, FieldState>();
    for (const block of resolvedBlocks) {
      for (const field of block.fields) {
        map.set(field.id, deriveFieldState(field, profileEntries, formOrg));
      }
    }
    return map;
  }, [resolvedBlocks, profileEntries, formOrg]);

  // Filter out hidden system-requirement fields and drop empty blocks.
  const visibleBlocks: ResolvedBlock[] = useMemo(() => {
    return resolvedBlocks
      .map((b) => ({
        ...b,
        fields: b.fields.filter(
          (f) => fieldStateMap.get(f.id) !== 'hidden',
        ),
      }))
      .filter((b) => b.fields.length > 0);
  }, [resolvedBlocks, fieldStateMap]);

  const displaySteps = useMemo(
    () => buildDisplaySteps(visibleBlocks),
    [visibleBlocks],
  );

  // Pre-fill state-3 fields once the profile arrives.
  useEffect(() => {
    if (!profileLoaded) return;
    const prefill: Record<string, ProfileEntryValue> = {};
    for (const block of visibleBlocks) {
      for (const field of block.fields) {
        if (fieldStateMap.get(field.id) === 'profile-prefilled') {
          const key = field.systemKey as SystemRequirementKey;
          const entry = profileEntries[key];
          if (entry) prefill[field.id] = entry.value;
        }
      }
    }
    if (Object.keys(prefill).length === 0) return;
    // Existing user edits win; only fill keys we don't have yet.
    setFormData((prev) => {
      const merged = { ...prev };
      for (const [k, v] of Object.entries(prefill)) {
        if (!(k in merged)) merged[k] = v;
      }
      return merged;
    });
    // biome-ignore lint/correctness/useExhaustiveDependencies: prefill on initial profile load only
  }, [profileLoaded]);

  const totalSteps = displaySteps.length;
  const currentDisplayStep = displaySteps[currentStep];
  const currentBlock = currentDisplayStep?.block;
  const isDocumentStep = !!currentDisplayStep?.documentField;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Set of field ids whose value is pulled from the profile (state 3).
  // Drives the ProfileFieldDisplay rendering in FormStep.
  const profilePrefilledFieldIds = useMemo(() => {
    const set = new Set<string>();
    for (const [id, state] of fieldStateMap) {
      if (state === 'profile-prefilled') set.add(id);
    }
    return set;
  }, [fieldStateMap]);

  function handleFieldChange(
    fieldId: string,
    value: string | boolean | string[],
  ) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => prev.filter((e) => e.fieldId !== fieldId));
  }

  function handleStartEdit(fieldId: string) {
    setEditSnapshots((prev) => {
      if (fieldId in prev) return prev;
      return { ...prev, [fieldId]: formData[fieldId] ?? '' };
    });
    setEditingFieldIds((prev) => {
      if (prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.add(fieldId);
      return next;
    });
  }

  function handleCancelEdit(fieldId: string) {
    setFormData((prev) => {
      if (!(fieldId in editSnapshots)) return prev;
      return { ...prev, [fieldId]: editSnapshots[fieldId]! };
    });
    setEditSnapshots((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setEditingFieldIds((prev) => {
      if (!prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
    setErrors((prev) => prev.filter((e) => e.fieldId !== fieldId));
  }

  async function handleConfirmEdit(fieldId: string) {
    const field = currentBlock?.fields.find((f) => f.id === fieldId);
    setEditingFieldIds((prev) => {
      if (!prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
    setEditSnapshots((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    if (!field?.systemKey) return;
    const value = formData[fieldId];
    if (value === undefined || value === '' || value === null) return;
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              key: field.systemKey as SystemRequirementKey,
              value,
              subOrg: formOrg,
            },
          ],
        }),
      });
    } catch {
      // Best-effort — the final form submit will retry profile updates.
    }
  }

  function validateCurrentStep(): FieldError[] {
    if (!currentBlock) return [];
    return validateStepFields(currentBlock.fields, formData);
  }

  function handleNext() {
    const stepErrors = validateCurrentStep();
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    setErrors([]);
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    const stepErrors = validateCurrentStep();
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    // Split formData into submission data (regular fields) and profile
    // updates (system requirements that were touched).
    const submissionData: Record<string, string | boolean | string[]> = {};
    const profileUpdates: {
      key: SystemRequirementKey;
      value: ProfileEntryValue;
      subOrg: string;
    }[] = [];

    for (const block of visibleBlocks) {
      for (const field of block.fields) {
        if (field.systemKey) {
          const value = formData[field.id];
          if (value === undefined || value === '' || value === null) continue;
          profileUpdates.push({
            key: field.systemKey as SystemRequirementKey,
            value,
            subOrg: formOrg,
          });
        } else if (field.id in formData) {
          submissionData[field.id] = formData[field.id]!;
        }
      }
    }

    setSubmitting(true);
    try {
      const [submissionRes, profileRes] = await Promise.all([
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formSlug: config.slug,
            data: submissionData,
          }),
        }),
        profileUpdates.length > 0
          ? fetch('/api/user-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entries: profileUpdates }),
            })
          : Promise.resolve(new Response(null, { status: 200 })),
      ]);

      if (!submissionRes.ok) {
        const body = (await submissionRes.json()) as {
          errors?: FieldError[];
        };
        if (body.errors) {
          setErrors(body.errors);
          return;
        }
        throw new Error('Submission failed');
      }
      if (!profileRes.ok) {
        throw new Error('Profile update failed');
      }

      onSuccess();
    } catch {
      setErrors([
        {
          fieldId: '__form',
          message:
            'Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  const formError = errors.find((e) => e.fieldId === '__form');

  if (!currentBlock) {
    // All fields ended up hidden — nothing for the volunteer to do.
    return (
      <p className="text-muted-foreground py-8 text-center">
        Es gibt aktuell nichts auszufüllen.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <StepProgress currentStep={currentStep + 1} totalSteps={totalSteps} />

      <FormStep
        block={currentBlock}
        data={formData}
        errors={errors}
        onChange={handleFieldChange}
        showDocumentPreview={isDocumentStep}
        profilePrefilledFieldIds={profilePrefilledFieldIds}
        editingFieldIds={editingFieldIds}
        formOrg={formOrg}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onConfirmEdit={handleConfirmEdit}
      />

      {formError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">
          {formError.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        {!isFirstStep ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={submitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Zurueck
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {config.settings.submitButtonLabel}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Weiter
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
