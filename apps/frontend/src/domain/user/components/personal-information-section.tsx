import { getTranslations } from 'next-intl/server';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { ProfileField } from './profile-field';

type PersonalInformationSectionProps = {
  me: { email: string };
  profile: { data: Record<string, unknown> } | null;
};

type FieldItem = {
  label: string;
  value: string | null;
  subtitle?: string;
};

export const PersonalInformationSection = async ({
  me,
  profile,
}: PersonalInformationSectionProps) => {
  const tFields = await getTranslations('RequirementForm.fieldForm');
  const tSubtitles = await getTranslations('Profile.identity.subtitles');
  const { formatDate } = await getFormatting();

  const data = (profile?.data ?? {}) as Record<string, unknown>;
  const str = (key: string): string | null => {
    const value = data[key];
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  };

  let formattedBirthDate: string | null = null;
  const birthDate = str('birth-date');
  if (birthDate) {
    const parsed = new Date(birthDate);
    if (!Number.isNaN(parsed.getTime())) {
      formattedBirthDate = formatDate(parsed);
    }
  }

  const fields: FieldItem[] = [
    {
      label: tFields('preferredName'),
      subtitle: tSubtitles('preferredName'),
      value: str('preferred-name'),
    },
    {
      label: tFields('firstName'),
      subtitle: tSubtitles('firstName'),
      value: str('name'),
    },
    {
      label: tFields('lastName'),
      subtitle: tSubtitles('lastName'),
      value: str('lastname'),
    },
    {
      label: tFields('gender'),
      value: str('gender'),
    },
    {
      label: tFields('email'),
      value: me.email,
    },
    {
      label: tFields('phone'),
      value: str('phone'),
    },
    {
      label: tFields('birthDate'),
      value: formattedBirthDate,
    },
    {
      label: tFields('address'),
      value: str('address'),
    },
    {
      label: tFields('zipCode'),
      value: str('zip'),
    },
    {
      label: tFields('city'),
      value: str('city'),
    },
    {
      label: tFields('iban'),
      subtitle: tSubtitles('iban'),
      value: str('iban'),
    },
  ];

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <ProfileField key={field.label} {...field} />
      ))}
    </div>
  );
};
