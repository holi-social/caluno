import type { MyOrgUnitFormsQuery } from '@repo/data';
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
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFormatting } from '@/lib/formatting/formatting-server';

type MembershipFormCardProps = {
  item: MyOrgUnitFormsQuery['myOrgUnitForms'][number];
};

export const MembershipFormCard = async ({ item }: MembershipFormCardProps) => {
  const t = await getTranslations('MembershipDetail.forms');
  const { formatDate } = await getFormatting();

  const completed =
    item.completed && Boolean(item.submissionId) && Boolean(item.submittedAt);
  const submission = completed
    ? {
        submissionId: item.submissionId as string,
        submittedAt: item.submittedAt as string,
      }
    : null;

  const statusLabel = t(
    completed ? 'status.completed' : 'status.notCompleted',
  );
  const description = submission
    ? t('completedOn', {
        date: formatDate(new Date(submission.submittedAt)),
      })
    : t('notCompletedPrompt');
  const actionLabel = t(completed ? 'view' : 'fillIn');
  const actionHref = submission
    ? `/forms/submissions/${submission.submissionId}`
    : `/f/${item.form.shareToken}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-muted p-2 border rounded-lg">
            <FileText className="text-muted-foreground size-4" />
          </div>
          <span className="truncate">{item.form.name}</span>
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
};
