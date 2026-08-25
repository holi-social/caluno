'use client';

import { Skeleton } from '@repo/ui';
import dynamic from 'next/dynamic';
import type { PublicForm } from './volunteer-form';

const VolunteerForm = dynamic(
  () => import('./volunteer-form').then((m) => m.VolunteerForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    ),
  },
);

export function VolunteerFormWrapper({
  form,
  token,
  isMember,
  orgName,
  profileData,
}: {
  form: PublicForm;
  token: string;
  isMember: boolean;
  orgUId: string;
  orgName?: string;
  profileData?: Record<string, string>;
}) {
  return (
    <VolunteerForm
      form={form}
      token={token}
      isMember={isMember}
      orgName={orgName}
      profileData={profileData}
    />
  );
}
