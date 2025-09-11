import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';
import { DiscoverFilters } from '@/components/DiscoverFilters';
import { getProfile } from '../../getProfile';

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  return {
    title: `定制语音用户 | ${profile?.name}` || '定制语音用户',
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);

  return (
    <div className="p-4">
      <h1 className="mb-6 text-4xl font-bold">定制语音用户</h1>
      <DiscoverSearch label="搜索定制语音用户" />
      <DiscoverFilters />
      <DiscoverProfiles punkedOnly={true} />
    </div>
  );
}
