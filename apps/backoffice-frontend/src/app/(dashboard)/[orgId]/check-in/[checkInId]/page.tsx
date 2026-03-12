import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { AlertCircle, CheckCircle2, User } from 'lucide-react';
import Image from 'next/image';
import { getDataClient } from '@/lib/data-client';

interface CheckinPageProps {
  params: Promise<{ orgId: string; checkInId: string }>;
}

type CheckInStatus =
  | 'valid'
  | 'blocked'
  | 'information-required'
  | 'id-check'
  | 'already-checked-in';

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { orgId, checkInId } = await params;

  const data = await getDataClient();
  const user = await data.user.findByCheckInId(checkInId);

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Volunteer does not exist</AlertTitle>
        <AlertDescription>
          There is no volunteers that matches this QR iD. The QR iD may have
          been re-generated and so this QR iD is no longer valid. Try and other
          QR iD or search for the volunteer to check them in.
        </AlertDescription>
      </Alert>
    );
  }

  const status: CheckInStatus = 'valid';

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
        </div>
        <div className="lg:px-2 lg:py-8 py-4 space-y-4">
          {status === 'blocked' && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Check-in denied</AlertTitle>
              <AlertDescription>
                The volunteer is not permitted to check-in. They must contact
                Headquarters for assistance.
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4 gap-2">
            <CardHeader className="px-0">
              <CardTitle>
                {user.name} <span className="font-light">({user.email})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {user.image ? (
                <Image src={user.image} alt="Volunteers profile photo" />
              ) : (
                <div className="border-8 rounded-2xl inline-block">
                  <User className="size-72 max-w-full text-accent/90" />
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <CheckCircle2 className="text-green-500" /> All met
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle>Shift</CardTitle>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="w-full" disabled={status !== 'valid'}>
            Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
