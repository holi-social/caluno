type ProfileFieldProps = {
  label: string;
  subtitle?: string;
  value: string | null;
};

export const ProfileField = ({ label, subtitle, value }: ProfileFieldProps) => {
  const isEmpty = value === null || value.trim() === '';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      {isEmpty ? (
        <span className="text-sm text-muted-foreground">-</span>
      ) : (
        <span className="break-all text-sm">{value}</span>
      )}
    </div>
  );
};
