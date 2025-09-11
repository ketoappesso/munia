'use client';

import { Select } from '@/components/ui/Select';
import { kebabCase, lowerCase, snakeCase, startCase, toUpper } from 'lodash';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Item } from 'react-stately';
import { DiscoverFilterKeys, DiscoverFilters as TDiscoverFilters } from '@/types/definitions';
import { Key, useCallback } from 'react';

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const filters = {
    gender: searchParams.get('gender') || undefined,
    relationshipStatus: searchParams.get('relationship-status') || undefined,
  };
  const genderFilters = ['MALE', 'FEMALE', 'NONBINARY'];
  const relationshipStatusFilters = ['SINGLE', 'IN_A_RELATIONSHIP', 'ENGAGED', 'MARRIED'];

  // 显示用中文标签
  const genderLabels: Record<string, string> = {
    MALE: '男',
    FEMALE: '女',
    NONBINARY: '非二元',
  };
  const relationshipLabels: Record<string, string> = {
    SINGLE: '单身',
    IN_A_RELATIONSHIP: '恋爱中',
    ENGAGED: '订婚',
    MARRIED: '已婚',
  };

  const updateParams = useCallback(
    <T extends DiscoverFilterKeys>({ key, value }: { key: T; value: TDiscoverFilters[T] }) => {
      const newSearchParams = new URLSearchParams(searchParams);

      if (value === undefined) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, kebabCase(value));
      }

      const url = `${pathname}?${newSearchParams.toString()}`;
      router.push(url, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const onSelectGender = useCallback(
    (value: Key) => {
      updateParams({
        key: 'gender',
        value: value as TDiscoverFilters['gender'],
      });
    },
    [updateParams],
  );
  const onSelectRelationshipStatus = useCallback(
    (value: Key) => {
      updateParams({
        key: 'relationship-status',
        value: value as TDiscoverFilters['relationship-status'],
      });
    },
    [updateParams],
  );

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
      <div className="flex-1">
        <Select
          label="按性别筛选"
          selectedKey={toUpper(snakeCase(filters.gender)) || null}
          onSelectionChange={onSelectGender}>
          {genderFilters.map((gender) => (
            <Item key={gender}>{genderLabels[gender] || gender}</Item>
          ))}
        </Select>
      </div>
      <div className="flex-1">
        <Select
          label="按状态筛选"
          selectedKey={toUpper(snakeCase(filters.relationshipStatus)) || null}
          onSelectionChange={onSelectRelationshipStatus}>
          {relationshipStatusFilters.map((relationship) => (
            <Item key={relationship}>{relationshipLabels[relationship] || relationship}</Item>
          ))}
        </Select>
      </div>
    </div>
  );
}
