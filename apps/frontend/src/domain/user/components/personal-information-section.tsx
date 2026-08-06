import { getTranslations } from 'next-intl/server';
import { SYSTEM_PROFILE_FIELDS } from '@/domain/requirement-form/system-profile-fields';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { ProfileField } from './profile-field';

type PersonalInformationSectionProps = {
  user: { email: string };
  profile: { data: Record<string, unknown> } | null;
};

type FieldItem = {
  label: string;
  value: string | null;
  subtitle?: string;
};

export const PersonalInformationSection = async ({
  user,
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

  const subtitleByKey: Record<string, string> = {
    'preferred-name': tSubtitles('preferredName'),
    name: tSubtitles('firstName'),
    lastname: tSubtitles('lastName'),
    iban: tSubtitles('iban'),
  };

  const fields: FieldItem[] = SYSTEM_PROFILE_FIELDS.map((field) => {
    let value: string | null;
    if (field.key === 'email') {
      value = user.email;
    } else if (field.key === 'birth-date') {
      value = formattedBirthDate;
    } else {
      value = str(field.key);
    }
    return {
      label: tFields(field.labelKey),
      value,
      subtitle: subtitleByKey[field.key],
    };
  });

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <ProfileField key={field.label} {...field} />
      ))}
    </div>
  );
};
