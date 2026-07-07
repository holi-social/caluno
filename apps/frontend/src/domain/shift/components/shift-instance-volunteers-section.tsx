'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserCard } from '@/components/user-card';
import { useSheet } from '@/hooks/use-sheet';

type Volunteer = {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
};

type ShiftInstanceVolunteersSectionProps = {
  shiftId: string;
  instanceId: string;
  volunteers: Volunteer[];
  canManage: boolean;
  isCancelled: boolean;
};

export function ShiftInstanceVolunteersSection({
  shiftId,
  instanceId,
  volunteers,
  canManage,
  isCancelled,
}: ShiftInstanceVolunteersSectionProps) {
  const inviteSheet = useSheet('invite-shift', 'id', 'instanceId');
  const t = useTranslations('ShiftInstanceDetail');

  const count = volunteers.length;
  const showInvite = canManage && !isCancelled;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-lg">{t('volunteers.heading')}</CardTitle>
        {showInvite && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => inviteSheet.open({ id: shiftId, instanceId })}
          >
            <UserPlus className="size-4" />
            {t('volunteers.invite')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t('volunteers.empty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {volunteers.map((volunteer) => (
              <li key={volunteer.id}>
                <UserCard user={volunteer} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
