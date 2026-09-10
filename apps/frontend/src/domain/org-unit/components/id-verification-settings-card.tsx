'use client';

import { useUpdateOrganizationUnit } from '@repo/data/react';
import { Card, CardContent, Switch } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

interface IdVerificationSettingsCardProps {
  organizationUnitId: string;
  organizationId: string;
  initialEnabled: boolean;
  canEdit: boolean;
}

export function IdVerificationSettingsCard({
  organizationUnitId,
  organizationId,
  initialEnabled,
  canEdit,
}: IdVerificationSettingsCardProps) {
  const t = useTranslations('IdVerification');
  const router = useRouter();
  const mutation = useUpdateOrganizationUnit();
  const [enabled, setEnabled] = useState(initialEnabled);

  const handleToggle = async (next: boolean) => {
    setEnabled(next);
    try {
      await mutation.mutateAsync({
        id: organizationUnitId,
        input: { organizationId, idVerificationEnabled: next },
      });
      router.refresh();
    } catch {
      setEnabled(!next);
      toast.error(t('card.updateError'));
    }
  };

  return (
    <Card className="max-w-xl">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex-1 space-y-1">
          <p className="font-medium">{t('card.label')}</p>
          <p className="text-sm text-muted-foreground">
            {t('card.description')}
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={!canEdit || mutation.isPending}
          onCheckedChange={handleToggle}
        />
      </CardContent>
    </Card>
  );
}
