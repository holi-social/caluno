import type { ReactNode } from 'react';

type VolunteerShellProps = {
  header: ReactNode;
  children: ReactNode;
};

export const VolunteerShell = ({ header, children }: VolunteerShellProps) => (
  <>
    <div className="shrink">{header}</div>

    <main className="grow overflow-y-auto pb-16">
      <div className="container mx-auto p-6 pt-8 max-w-4xl">{children}</div>
    </main>
  </>
);
