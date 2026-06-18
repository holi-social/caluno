import { LocaleSwitcher } from '@/components/locale-switcher';

export default async function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Edit Profile</h1>
      <LocaleSwitcher />
    </div>
  );
}
