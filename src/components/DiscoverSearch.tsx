'use client';

import { TextInput } from '@/components/ui/TextInput';
import SvgSearch from '@/svg_components/Search';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function DiscoverSearch({ label }: { label?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleChange = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams);
      if (search === '') {
        params.delete('search');
      } else {
        params.set('search', search);
      }

      const url = `${pathname}?${params.toString()}`;
      router.push(url, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="sticky top-4 z-[2] mb-4">
      <TextInput 
        onChange={handleChange} 
        label={label || t('nav.searchPeople')} 
        Icon={SvgSearch}
        value={searchParams.get('search') || ''}
      />
    </div>
  );
}
