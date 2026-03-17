import type { ActiveShift, User } from '@repo/data';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2, UserIcon } from 'lucide-react';
import Image from 'next/image';
import type { CheckInStatus } from '@/app/(dashboard)/[orgId]/check-in/[checkInId]/page';
import { ShiftSelectorCard } from './shift-selector-card';

type CheckinFormProps = {
  organizationId: string;
  volunteer: User;
  shifts: ActiveShift[];
  status: CheckInStatus;
};

export const CheckinForm = ({
  volunteer,
  organizationId,
  shifts,
  status,
}: CheckinFormProps) => (
  <div className="space-y-4">
    <Card className="p-4 gap-2">
      <CardHeader className="px-0">
        <CardTitle>
          {volunteer.name}{' '}
          <span className="font-light">({volunteer.email})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {volunteer.image ? (
          <Image src={volunteer.image} alt="Volunteers profile photo" />
        ) : (
          <div className="border-8 rounded-2xl inline-block">
            <UserIcon className="size-72 max-w-full text-accent/90" />
          </div>
        )}
      </CardContent>
    </Card>
    <div className="grid grid-cols-2 gap-4">
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <CheckCircle2 className="text-green-500" /> All met
          </div>
        </CardContent>
      </Card>
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftSelectorCard shifts={shifts} organizationId={organizationId} />
        </CardContent>
      </Card>
    </div>

    <Button size="lg" className="w-full" disabled={status !== 'valid'}>
      Check-in
    </Button>
  </div>
);
