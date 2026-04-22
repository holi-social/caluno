import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { OctagonX } from 'lucide-react';
import Link from 'next/link';

interface RequestRejectedProps {
  orgName: string;
}

export function RequestRejected({ orgName }: RequestRejectedProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <OctagonX className="size-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Request rejected</CardTitle>
          <p className="text-muted-foreground">
            Your membership request for <strong>{orgName}</strong> was rejected.
            Contact an admin if you believe this was a mistake.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">Go to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/my-membership-requests">My requests</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
