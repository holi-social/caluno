import { notFound } from 'next/navigation';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { MembershipFormCard } from '@/domain/memberships/components/membership-form-card';
import { MembershipStatusBadge } from '@/domain/memberships/components/membership-status-badge';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { routes } from '@/lib/routes';

type Props = { params: Promise<{ locale: string; membershipId: string }> };

export default async function MembershipDetailPage({ params }: Props) {
  const { locale: rawLocale, membershipId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient();
  const membership = await data.membership.findMineById(membershipId);
  if (!membership) notFound();

  const forms = await data.requirementForm.findMyOrgUnitForms(
    membership.organizationUnit.id,
  );

  const t = await getTranslations('MembershipDetail');
  const format = await getFormatter();
  const formatDate = (date: Date | string) =>
    format.dateTime(new Date(date), { dateStyle: 'medium' });

  const orgUnit = membership.organizationUnit;
  const title = orgUnit.parent
    ? `${orgUnit.organization.name} · ${orgUnit.name}`
    : orgUnit.organization.name;

  return (
    <div className="space-y-6">
      <MembershipDetailHeader title={title} logoUrl={orgUnit.logoUrl} />

      <section className="space-y-1">
        <MembershipStatusBadge state="accepted" />
        {membership.roles.length > 0 && (
          <p className="text-muted-foreground">
            {t('role')}: {membership.roles.map((r) => r.name).join(', ')}
          </p>
        )}
        <p className="text-muted-foreground">
          {t('joinedDate', { date: formatDate(membership.createdAt) })}
        </p>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t('forms.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('forms.subtitle')}</p>
        </div>
        {forms.map((item) => (
          <MembershipFormCard
            key={item.form.id}
            name={item.form.name}
            statusLabel={t(
              item.completed
                ? 'forms.status.completed'
                : 'forms.status.notCompleted',
            )}
            completed={item.completed}
            description={
              item.completed
                ? t('forms.completedOn', {
                    date: formatDate(item.submittedAt!),
                  })
                : t('forms.notCompletedPrompt')
            }
            actionLabel={t(item.completed ? 'forms.view' : 'forms.fillIn')}
            actionHref={
              item.completed
                ? routes.formSubmission(item.submissionId!)
                : routes.publicForm(item.form.shareToken)
            }
          />
        ))}
      </section>
    </div>
  );
}
