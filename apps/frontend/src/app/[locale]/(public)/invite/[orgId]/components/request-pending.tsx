import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface RequestPendingProps {
  orgName: string;
}

export function RequestPending({ orgName }: RequestPendingProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="size-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Request pending</CardTitle>
          <p className="text-muted-foreground">
            Your membership request for <strong>{orgName}</strong> is pending
            approval. An admin will review it shortly.
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
