interface AuthPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function AuthPageShell({ title, children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="page-title">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
