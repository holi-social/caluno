import Link from 'next/link';

type ProfileFieldProps = {
  label: string;
  subtitle?: string;
  value: string | null;
  href?: string;
};

export const ProfileField = ({
  label,
  subtitle,
  value,
  href,
}: ProfileFieldProps) => {
  const isEmpty = value === null || value.trim() === '';

  return (
    <div className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      {isEmpty ? (
        <span className="text-sm text-muted-foreground">—</span>
      ) : href ? (
        <Link href={href} className="break-all text-sm">
          {value}
        </Link>
      ) : (
        <span className="break-all text-sm">{value}</span>
      )}
    </div>
  );
};
