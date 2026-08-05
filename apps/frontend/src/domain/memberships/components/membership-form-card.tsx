import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { FileText } from 'lucide-react';
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
        <FileText className="text-muted-foreground size-4" />
        <span>{name}</span>
      </CardTitle>
      <CardAction>
        <Badge variant={completed ? 'success' : 'alert'}>{statusLabel}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{description}</p>
      <Link
        href={actionHref}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start"
      >
        {actionLabel}
      </Link>
    </CardContent>
  </Card>
);
