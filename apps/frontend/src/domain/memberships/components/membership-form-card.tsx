import type { MyRequiredOrgUnitFormsQuery } from '@repo/data';
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

type OrgUnitForm =
  MyRequiredOrgUnitFormsQuery['myRequiredOrgUnitForms'][number];

export type FormSubmission = {
  form: OrgUnitForm;
  completed: boolean;
  submissionId?: string;
  submittedAt?: string;
};

type MembershipFormCardProps = {
  submission: FormSubmission;
};

export const MembershipFormCard = async ({
  submission,
}: MembershipFormCardProps) => {
  const t = await getTranslations('MembershipDetail.forms');
  const { formatDate } = await getFormatting();

  const statusLabel = t(
    submission.completed ? 'status.completed' : 'status.notCompleted',
  );
  const description = submission.completed
    ? t('completedOn', {
        date: submission.submittedAt
          ? formatDate(new Date(submission.submittedAt))
          : '',
      })
    : t('notCompletedPrompt');

  const actionLabel = t(submission.completed ? 'view' : 'fillIn');
  const actionHref = submission.completed
    ? `/profile/forms/submissions/${submission.submissionId}`
    : `/f/${submission.form.shareToken}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-muted p-2 border rounded-lg">
            <FileText className="text-muted-foreground size-4" />
          </div>
          <span className="truncate">{submission.form.name}</span>
        </CardTitle>
        <CardAction>
          <Badge variant={submission.completed ? 'success' : 'alert'}>
            {statusLabel}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-2">{description}</p>
        <Button asChild className="w-full sm:w-auto">
          <Link
            href={actionHref}
            target={submission.completed ? '' : '_blank'}
            rel="noopener noreferrer"
          >
            {!submission.completed && <SquareArrowOutUpRight />}
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
