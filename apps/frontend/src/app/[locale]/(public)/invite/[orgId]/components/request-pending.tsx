'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface RequestPendingProps {
  orgName: string;
}

export function RequestPending({ orgName }: RequestPendingProps) {
  const t = useTranslations('MembershipRequest');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="size-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('invite.pending.title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('invite.pending.message', { orgName })}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/profile#memberships">
              {t('invite.pending.viewRequests')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
