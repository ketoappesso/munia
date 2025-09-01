'use client';

import { DiscoverFilters } from '@/components/DiscoverFilters';
import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';

export default function Discover() {
  return (
    <div className="px-4 pt-4">
      <DiscoverSearch />
      <DiscoverFilters />
      <DiscoverProfiles />
    </div>
  );
}
