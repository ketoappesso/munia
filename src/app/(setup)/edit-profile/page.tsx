'use client';

import { EditProfileForm } from '@/components/EditProfileForm';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';

export default function Page() {
  const router = useRouter();

  return (
    <ResponsiveContainer className="mx-auto mb-4 px-4 md:px-0">
      <div className="flex items-center gap-2 my-4">
        <ButtonNaked
          onPress={() => router.back()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="返回">
          <ChevronLeft className="h-6 w-6" />
        </ButtonNaked>
        <h1 className="text-3xl font-bold">编辑资料</h1>
      </div>
      <EditProfileForm />
    </ResponsiveContainer>
  );
}
