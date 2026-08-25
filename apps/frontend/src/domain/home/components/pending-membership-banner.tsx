'use client';

import { Button, Card, CardContent } from '@repo/ui';
import { ClockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface PendingMembershipBannerProps {
  orgName: string;
  contactName?: string | null;
  requestsHref: string;
}

export function PendingMembershipBanner({
  orgName,
  contactName,
  requestsHref,
}: PendingMembershipBannerProps) {
  const t = useTranslations('VolunteerHome');

  return (
    <Card className="gap-0 py-7">
      <CardContent className="flex flex-col items-center gap-4 px-5 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ClockIcon className="size-6 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {t('pendingRequestTitle', { orgName })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pendingRequestBody')}
          </p>
          {contactName && (
            <p className="text-sm text-muted-foreground">
              {t('pendingRequestContact', { name: contactName })}
            </p>
          )}
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={requestsHref}>{t('pendingRequestCta')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
