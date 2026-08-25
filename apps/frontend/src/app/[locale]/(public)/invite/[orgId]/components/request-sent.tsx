'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface RequestSentProps {
  orgName: string;
}

export function RequestSent({ orgName }: RequestSentProps) {
  const t = useTranslations('MembershipRequest');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Send className="size-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('invite.sent.title')}</CardTitle>
          <p className="text-muted-foreground">
            {t('invite.sent.message', { orgName })}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/profile#memberships">
              {t('invite.sent.viewRequests')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
