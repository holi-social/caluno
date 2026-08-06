'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldLabel, Input } from '@repo/ui';
import { Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { updateUserProfile } from '@/domain/requirement-form/actions';
import {
  buildFieldSchema,
  FieldRenderer,
  type RenderableField,
  useValidationMessages,
} from '@/domain/requirement-form/components/field-renderer';
import { SYSTEM_PROFILE_FIELDS } from '@/domain/requirement-form/system-profile-fields';
import { useRouter } from '@/i18n/navigation';

type EditIdentityFormProps = {
  email: string;
  profile: { data: Record<string, unknown> } | null;
};

const editableFields = SYSTEM_PROFILE_FIELDS.filter((f) => f.key !== 'email');

const fieldToRenderable = (
  f: (typeof SYSTEM_PROFILE_FIELDS)[number],
  label: string,
  subtitle: string | undefined,
): RenderableField => ({
  id: f.key,
  systemKey: f.key,
  type: f.type,
  label,
  required: f.required,
  description: subtitle ?? null,
  placeholder: null,
  options: null,
  documentFileId: null,
  documentDownloadUrl: null,
  documentFilename: null,
  documentLabel: null,
  minAge: null,
});

const EditIdentityForm = ({ email, profile }: EditIdentityFormProps) => {
  const tFields = useTranslations('RequirementForm.fieldForm');
  const tSubtitles = useTranslations('Profile.identity.subtitles');
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const messages = useValidationMessages();

  const data = (profile?.data ?? {}) as Record<string, unknown>;

  const subtitleByKey = useMemo<Record<string, string>>(
    () => ({
      'preferred-name': tSubtitles('preferredName'),
      name: tSubtitles('firstName'),
      lastname: tSubtitles('lastName'),
      iban: tSubtitles('iban'),
    }),
    [tSubtitles],
  );

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const f of editableFields) {
      const v = data[f.key];
      vals[f.key] = typeof v === 'string' ? v : '';
    }
    return vals;
  }, [data]);

  const schema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          editableFields.map((f) => [
            f.key,
            buildFieldSchema(
              fieldToRenderable(f, tFields(f.labelKey), subtitleByKey[f.key]),
              f.required,
              messages,
            ),
          ]),
        ),
      ),
    [messages, tFields, subtitleByKey],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as Resolver<Record<string, string>>,
    defaultValues,
    mode: 'onChange',
  });

  const onSave = async (values: Record<string, string>) => {
    try {
      const res = await updateUserProfile({ data: values });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success(tProfile('saved'));
      router.replace('/profile');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tProfile('saveFailed'),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="space-y-4 rounded-lg border bg-card p-6">
        {SYSTEM_PROFILE_FIELDS.map((f) => {
          if (f.key === 'email') {
            return (
              <Field key="email">
                <FieldLabel htmlFor="email-locked">
                  {tFields('email')}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="email-locked"
                    value={email}
                    readOnly
                    disabled
                    className="flex-1"
                  />
                  <Lock
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tProfile('emailLocked')}
                </p>
              </Field>
            );
          }
          return (
            <Controller
              key={f.key}
              name={f.key}
              control={control}
              defaultValue=""
              render={({ field: ctrl }) => (
                <FieldRenderer
                  field={fieldToRenderable(
                    f,
                    tFields(f.labelKey),
                    subtitleByKey[f.key],
                  )}
                  value={ctrl.value ?? ''}
                  onChange={ctrl.onChange}
                  error={errors[f.key]?.message}
                />
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isSubmitting ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>
    </form>
  );
};

export default EditIdentityForm;
