'use client';

import type { GetFormSubmissionsByFormQuery } from '@repo/data/react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { Search, UserRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  groupSubmissionsByVolunteer,
  type VolunteerSubmissions,
} from './group-submissions';

const TAB_SUBMITTED = 'SUBMITTED';
const TAB_REJECTED = 'REJECTED';

type Submission =
  GetFormSubmissionsByFormQuery['formSubmissionsByForm']['items'][number];

export function FormSubmissionsClient({
  orgUId,
  submissions,
}: {
  orgUId: string;
  submissions: Submission[];
}) {
  const t = useTranslations('RequirementForm.submissions');
  const tCommon = useTranslations('Common');
  const formatter = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');

  const activeTab = searchParams.get('status') ?? TAB_SUBMITTED;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const query = search.trim().toLowerCase();

  const rowsForTab = (status: string): VolunteerSubmissions[] =>
    groupSubmissionsByVolunteer(submissions, status).filter(
      (entry) =>
        !query ||
        entry.user.name.toLowerCase().includes(query) ||
        entry.user.email.toLowerCase().includes(query),
    );

  const tabs = [
    { value: TAB_SUBMITTED, label: t('tabSubmitted') },
    { value: TAB_REJECTED, label: t('tabRejected') },
  ];

  const renderTable = (rows: VolunteerSubmissions[]) => (
    <>
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {query ? t('emptySearch') : t('empty')}
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('volunteerColumn')}</TableHead>
                <TableHead>{t('emailColumn')}</TableHead>
                <TableHead>{t('submissionsColumn')}</TableHead>
                <TableHead>{t('lastSubmittedColumn')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow
                  key={entry.user.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/admin/${orgUId}/volunteers/form-submission/${entry.latestSubmissionId}`,
                    )
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage
                          src={entry.user.image ?? undefined}
                          alt={tCommon('avatarAlt', {
                            name: entry.user.name,
                          })}
                        />
                        <AvatarFallback>
                          <UserRound className="size-3" />
                        </AvatarFallback>
                      </Avatar>
                      {entry.user.name}
                    </div>
                  </TableCell>
                  <TableCell>{entry.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.count}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatter.dateTime(new Date(entry.latestSubmittedAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t('viewSubmission')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
              {rowsForTab(tab.value).length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {renderTable(rowsForTab(tab.value))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
