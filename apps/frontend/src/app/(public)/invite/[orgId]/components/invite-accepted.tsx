import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface InviteAcceptedProps {
  orgName: string;
  orgUId: string;
}

export function InviteAccepted({ orgName, orgUId }: InviteAcceptedProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="size-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">You're all set</CardTitle>
          <p className="text-muted-foreground">
            You're already a member of <strong>{orgName}</strong>.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={`/admin/${orgUId}`}>Go to {orgName}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
