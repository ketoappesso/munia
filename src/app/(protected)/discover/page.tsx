'use client';

import { DiscoverFilters } from '@/components/DiscoverFilters';
import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';
import BackArrow from '@/svg_components/BackArrow';
import { useRouter } from 'next/navigation';

export default function Discover() {
  const router = useRouter();

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <BackArrow className="h-5 w-5 fill-gray-700" />
        </button>
        <h1 className="text-4xl font-bold">Discover</h1>
      </div>
      <DiscoverSearch />
      <DiscoverFilters />
      <DiscoverProfiles />
    </div>
  );
}
