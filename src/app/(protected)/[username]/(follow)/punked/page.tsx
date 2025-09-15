import { PunkedFollowers } from '@/components/PunkedFollowers';
import { getProfile } from '../../getProfile';

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  return {
    title: `定制语音粉丝 | ${profile?.name}` || '定制语音粉丝',
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);

  if (!profile) {
    return (
      <div className="p-4">
        <h1 className="mb-6 text-4xl font-bold">用户不存在</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-4xl font-bold">定制语音粉丝</h1>
      <p className="mb-4 text-gray-600">关注 {profile.name} 的定制语音用户</p>
      <PunkedFollowers userId={profile.id} />
    </div>
  );
}
