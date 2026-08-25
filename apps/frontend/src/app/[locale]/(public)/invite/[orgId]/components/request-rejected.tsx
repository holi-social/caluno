'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { OctagonX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface RequestRejectedProps {
  orgName: string;
}

export function RequestRejected({ orgName }: RequestRejectedProps) {
  const t = useTranslations('MembershipRequest');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <OctagonX className="size-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('invite.rejected.title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('invite.rejected.message', { orgName })}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">{t('invite.rejected.homeButton')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile#memberships">
              {t('invite.rejected.requestsButton')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
