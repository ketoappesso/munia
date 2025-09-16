'use client';

import { TabButton } from '@/components/TabButton';
import { usePathname, useSelectedLayoutSegment } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Tabs({ isOwnProfile }: { isOwnProfile: boolean }) {
  const selectedSegment = useSelectedLayoutSegment();
  const parentLayoutSegment = `/${usePathname().split('/')[1]}`;
  const { t } = useLanguage();

  return (
    <div className="mt-4 inline-flex flex-row gap-6 overflow-x-auto border-b-[1px] border-muted">
      {[
        { title: t('profile.posts'), segment: parentLayoutSegment },
        { title: t('profile.photos'), segment: `${parentLayoutSegment}/photos` },
        { title: t('profile.about'), segment: `${parentLayoutSegment}/about` },
        ...[isOwnProfile ? { title: t('profile.activity'), segment: `${parentLayoutSegment}/activity` } : undefined],
      ].map((item) => {
        if (!item) return null;
        const { title, segment } = item;
        const isActive =
          (selectedSegment === null ? parentLayoutSegment : `${parentLayoutSegment}/${selectedSegment}`) === segment;
        return <TabButton key={segment} title={title} isActive={isActive} href={segment} />;
      })}
    </div>
  );
}
