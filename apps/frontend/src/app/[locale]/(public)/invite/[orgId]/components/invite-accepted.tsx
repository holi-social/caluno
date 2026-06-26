'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface InviteAcceptedProps {
  orgName: string;
  orgUId: string;
}

export function InviteAccepted({ orgName, orgUId }: InviteAcceptedProps) {
  const t = useTranslations('MembershipRequest');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="size-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('invite.accepted.title')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('invite.accepted.message', { orgName })}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={`/admin/${orgUId}`}>
              {t('invite.accepted.cta', { orgName })}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
