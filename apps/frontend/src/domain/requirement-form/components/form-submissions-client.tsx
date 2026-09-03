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
} from '@repo/ui';
import { Search, UserRound } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { groupSubmissionsByVolunteer } from './group-submissions';

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
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();

  const rows = groupSubmissionsByVolunteer(submissions).filter(
    (entry) =>
      !query ||
      entry.user.name.toLowerCase().includes(query) ||
      entry.user.email.toLowerCase().includes(query),
  );

  return (
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
}
