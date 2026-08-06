import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { FileText, SquareArrowOutUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type MembershipFormCardProps = {
  name: string;
  statusLabel: string;
  completed: boolean;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export const MembershipFormCard = ({
  name,
  statusLabel,
  completed,
  description,
  actionLabel,
  actionHref,
}: MembershipFormCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <div className="bg-muted p-2 border rounded-lg">
          <FileText className="text-muted-foreground size-4" />
        </div>
        <span className="truncate">{name}</span>
      </CardTitle>
      <CardAction>
        <Badge variant={completed ? 'success' : 'alert'}>{statusLabel}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm mb-2">{description}</p>
      <Button asChild className="w-full sm:w-auto">
        <Link href={actionHref} target="_blank" rel="noopener noreferrer">
          <SquareArrowOutUpRight />
          {actionLabel}
        </Link>
      </Button>
    </CardContent>
  </Card>
);
