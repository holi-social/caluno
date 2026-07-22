'use client';

import {
  JoinStatus,
  type RequiredForm,
  useJoinOrganization,
  useOrganizationUnitWithSuspense,
} from '@repo/data/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { CheckCircle2, Circle, FileText, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { RequiredFormRenderer } from '@/domain/requirement-form/components/required-form-renderer';
import { Link, useRouter } from '@/i18n/navigation';
import { getSafeRedirect } from '@/lib/safe-redirect';

export type RequiredFormItem = {
  form: RequiredForm;
  order: number;
};

interface JoinFormsClientProps {
  orgUId: string;
  orgName: string;
  requiredForms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  redirectTo?: string;
}

export function JoinFormsClient({
  orgUId,
  orgName,
  requiredForms: initialRequiredForms,
  profileData,
  initialSubmittedFormIds,
  redirectTo,
}: JoinFormsClientProps) {
  const t = useTranslations('MembershipRequest.joinForms');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const joinOrganization = useJoinOrganization();

  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(
    initialSubmittedFormIds,
  );

  const { data: orgUnit } = useOrganizationUnitWithSuspense(orgUId);
  const requiredForms = orgUnit?.requiredForms ?? initialRequiredForms;

  const allSubmitted = requiredForms.every((ref) =>
    submittedFormIds.has(ref.form.id),
  );

  const activeForm = activeFormId
    ? requiredForms.find((ref) => ref.form.id === activeFormId)?.form
    : undefined;

  const handleFormSubmitted = (formId: string) => {
    setSubmittedFormIds((prev) => new Set([...prev, formId]));
    setActiveFormId(null);
  };

  const handleRequestToJoin = async () => {
    try {
      const result = await joinOrganization.mutateAsync(orgUId);

      if (result.status === JoinStatus.Joined) {
        toast.success(t('joined'));
        router.push(getSafeRedirect(redirectTo) ?? `/admin/${orgUId}`);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('requestPending'));
        router.push(`/invite/${orgUId}`);
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('rejected'));
        router.push(`/invite/${orgUId}`);
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        toast.error(t('requirementsNeeded'));
        const missingIds =
          result.requiredForms
            ?.filter((f) => !f.submitted)
            .map((f) => f.form.id) ?? [];
        setSubmittedFormIds((prev) => {
          const next = new Set(prev);
          for (const id of missingIds) {
            next.delete(id);
          }
          return next;
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('requestFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title', { orgName })}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredForms.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noForms')}</p>
          ) : (
            <div className="space-y-3">
              {requiredForms.map((ref) => {
                const isSubmitted = submittedFormIds.has(ref.form.id);
                return (
                  <div
                    key={ref.form.id}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    {isSubmitted ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{ref.form.name}</span>
                      </div>
                      {ref.form.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {ref.form.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {isSubmitted ? t('completed') : t('pending')}
                      </p>
                    </div>
                    {!isSubmitted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveFormId(ref.form.id)}
                      >
                        {t('fillOut')}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" asChild>
              <Link href="/">{tCommon('cancel')}</Link>
            </Button>
            <Button
              onClick={handleRequestToJoin}
              disabled={!allSubmitted || joinOrganization.isPending}
            >
              {joinOrganization.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('requestToJoin')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={activeFormId !== null}
        onOpenChange={() => setActiveFormId(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('fillFormTitle')}</DialogTitle>
          </DialogHeader>
          {activeForm && activeFormId && (
            <RequiredFormRenderer
              organizationUnitId={orgUId}
              form={activeForm}
              profileData={profileData}
              onSubmitted={() => handleFormSubmitted(activeFormId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
