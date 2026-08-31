'use client';

import {
  useMyCheckInOrgUnits,
  useOrganizationVolunteers,
} from '@repo/data/react';
import {
  Button,
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  useIsMobile,
} from '@repo/ui';
import { ArrowLeft, Building2, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { CheckInSelector } from './check-in-selector';

interface ManualCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualCheckInDialog({
  open,
  onOpenChange,
}: ManualCheckInDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(
    null,
  );
  const isMobile = useIsMobile();
  const router = useRouter();
  const t = useTranslations('CheckIn');

  const { data: orgUnits } = useMyCheckInOrgUnits({ enabled: open });
  const resolvedOrgId =
    orgUnits?.length === 1 ? (orgUnits[0]?.id ?? null) : selectedOrgId;

  const { data: volunteers } = useOrganizationVolunteers(resolvedOrgId ?? '');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedOrgId(null);
      setSelectedCheckInId(null);
    }
    onOpenChange(nextOpen);
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedCheckInId(null);
  };

  const handleCheckIn = () => {
    if (resolvedOrgId && selectedCheckInId) {
      router.push(
        `/admin/${resolvedOrgId}/check-in/${selectedCheckInId}/decide`,
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className={cn(
          'flex h-full w-full flex-col gap-0 p-0 md:max-w-md',
          isMobile && 'max-h-[calc(100vh-1.5rem)] rounded-t-2xl',
        )}
      >
        <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
          >
            <ArrowLeft />
          </Button>
          <SheetTitle className="flex-1 text-center text-lg">
            {t('manualCheckin')}
          </SheetTitle>
          <div className="size-9 shrink-0" />
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          {orgUnits && orgUnits.length > 1 && (
            <Select
              value={selectedOrgId ?? undefined}
              onValueChange={handleOrgChange}
            >
              <SelectTrigger className="w-full">
                <Building2 className="text-muted-foreground" />
                <SelectValue placeholder={t('selectOrgUnit')} />
              </SelectTrigger>
              <SelectContent>
                {orgUnits.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {resolvedOrgId && (
            <CheckInSelector
              volunteers={volunteers ?? []}
              selectedCheckInId={selectedCheckInId}
              onSelectedCheckInIdChange={setSelectedCheckInId}
            />
          )}
        </div>

        <div className="border-t p-4">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!selectedCheckInId}
            onClick={handleCheckIn}
          >
            <UserCheck /> {t('checkInButton')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
