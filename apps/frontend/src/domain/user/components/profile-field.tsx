type ProfileFieldProps = {
  label: string;
  subtitle?: string;
  value: string | null;
};

export const ProfileField = ({ label, subtitle, value }: ProfileFieldProps) => {
  const isEmpty = value === null || value.trim() === '';

  return (
    <div className="space-y-1">
      <div>
        <h3 className="text-base">{label}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {isEmpty ? (
        <span className="text-sm text-muted-foreground">-</span>
      ) : (
        <span className="break-all text-sm">{value}</span>
      )}
    </div>
  );
};
