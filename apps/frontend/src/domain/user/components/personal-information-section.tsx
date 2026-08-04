import { getFormatter, getTranslations } from 'next-intl/server';
import { ProfileField } from './profile-field';

type PersonalInformationSectionProps = {
  me: { email: string };
  profile: { data: Record<string, unknown> } | null;
};

type FieldItem = {
  label: string;
  value: string | null;
  subtitle?: string;
  href?: string;
};

export const PersonalInformationSection = async ({
  me,
  profile,
}: PersonalInformationSectionProps) => {
  const tFields = await getTranslations('Profile.identity.fields');
  const tSubtitles = await getTranslations('Profile.identity.subtitles');
  const formatter = await getFormatter();

  const data = (profile?.data ?? {}) as Record<string, unknown>;
  const str = (key: string): string | null => {
    const value = data[key];
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  };

  const phone = str('phone');

  let formattedBirthDate: string | null = null;
  const birthDate = str('birth-date');
  if (birthDate) {
    const parsed = new Date(birthDate);
    if (!Number.isNaN(parsed.getTime())) {
      formattedBirthDate = formatter.dateTime(parsed, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
      href: `mailto:${me.email}`,
    },
    {
      label: tFields('phoneNumber'),
      value: phone,
      href: phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined,
    },
    {
      label: tFields('dateOfBirth'),
      value: formattedBirthDate,
    },
    {
      label: tFields('address'),
      value: str('address'),
    },
    {
      label: tFields('postcode'),
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
    <div className="divide-y divide-border">
      {fields.map((field) => (
        <ProfileField key={field.label} {...field} />
      ))}
    </div>
  );
};
