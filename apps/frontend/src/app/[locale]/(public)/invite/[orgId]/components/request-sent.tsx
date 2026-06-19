import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface RequestSentProps {
  orgName: string;
}

export function RequestSent({ orgName }: RequestSentProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Send className="size-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Request sent</CardTitle>
          <p className="text-muted-foreground">
            Your membership request for <strong>{orgName}</strong> has been sent
            successfully. An admin will review it shortly.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/my-membership-requests">View my requests</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
