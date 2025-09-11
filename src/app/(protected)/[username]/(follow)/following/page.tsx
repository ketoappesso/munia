import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';
import { DiscoverFilters } from '@/components/DiscoverFilters';
import { getProfile } from '../../getProfile';

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  return {
    title: `关注 | ${profile?.name}` || '关注',
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);

  return (
    <div className="p-4">
      <h1 className="mb-6 mt-1 text-4xl font-bold">{profile?.name} 的关注</h1>
      <DiscoverSearch label="搜索关注的人" />
      <DiscoverFilters />
      <DiscoverProfiles followingOf={profile?.id} />
    </div>
  );
}
