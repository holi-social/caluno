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
import { AlertCircle, User } from 'lucide-react';
import Image from 'next/image';
import { getDataClient } from '@/lib/data-client';

interface CheckinPageProps {
  params: Promise<{ orgId: string; checkInId: string }>;
}

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

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
          <p className="text-muted-foreground">
            Check the details and check them into a shift
          </p>
        </div>
        <div className="px-2 py-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {user.name} <span className="font-light">({user.email})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.image ? (
                <Image src={user.image} alt="Volunteers profile photo" />
              ) : (
                <div className="border-8 rounded-2xl inline-block">
                  <User className="size-72 text-accent/90" />
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <CardTitle>Requirements</CardTitle>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <CardTitle>Shift</CardTitle>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="w-full">
            Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
