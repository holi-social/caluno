import { AvatarEditForm } from '@/domain/user/components/avatar-edit-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { getDataClient } from '@/lib/data-client';

export default async function ProfilePage() {
  const data = await getDataClient();
  const me = await data.user.getMe();

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <AvatarEditForm imageUrl={me.image} />
      </div>
    </div>
  );
}
