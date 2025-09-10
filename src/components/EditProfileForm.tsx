/* eslint-disable react-perf/jsx-no-new-function-as-prop */

'use client';

import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Item } from 'react-stately';
import { AtSign, BuildingBusinessOffice, Bullhorn, Heart, Other, Phone, Profile, WorldNet } from '@/svg_components';
import { UserAboutSchema, userAboutSchema } from '@/lib/validations/userAbout';
import { formatISO } from 'date-fns';
import { parseDate } from '@internationalized/date';
import { useSessionUserData } from '@/hooks/useSessionUserData';
import { useSessionUserDataMutation } from '@/hooks/mutations/useSessionUserDataMutation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { GenericLoading } from './GenericLoading';
import { DatePicker } from './ui/DatePicker';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import Button from './ui/Button';
import { TextInput } from './ui/TextInput';

export function EditProfileForm({ redirectTo }: { redirectTo?: string }) {
  const [userData] = useSessionUserData();
  const defaultValues = useMemo(
    () => ({
      // `undefined` is not allowed as a `defaultValue` https://www.react-hook-form.com/api/usecontroller/controller/
      username: userData?.username || userData?.id || '',
      // email: userData?.email || '',
      name: userData?.name || '',
      phoneNumber: userData?.phoneNumber || null,
      bio: userData?.bio || null,
      website: userData?.website || null,
      address: userData?.address || null,
      gender:
        userData?.gender && ['FEMALE', 'MALE', 'NONBINARY'].includes(userData.gender)
          ? (userData.gender as 'FEMALE' | 'MALE' | 'NONBINARY')
          : null,
      relationshipStatus:
        userData?.relationshipStatus &&
        ['SINGLE', 'IN_A_RELATIONSHIP', 'ENGAGED', 'MARRIED'].includes(userData.relationshipStatus)
          ? (userData.relationshipStatus as 'SINGLE' | 'IN_A_RELATIONSHIP' | 'ENGAGED' | 'MARRIED')
          : null,
      birthDate: userData?.birthDate?.toString() || null,
    }),
    [userData],
  );

  const { control, handleSubmit, reset, setError, setFocus } = useForm<UserAboutSchema>({
    resolver: zodResolver(userAboutSchema),
    defaultValues,
  });
  const { updateSessionUserDataMutation } = useSessionUserDataMutation();
  const router = useRouter();

  const onValid: SubmitHandler<UserAboutSchema> = (data) => {
    updateSessionUserDataMutation.mutate(
      { data },
      {
        onError: (error) => {
          const { field, message } = JSON.parse(error.message) as {
            field: keyof UserAboutSchema;
            message: string;
          };
          setError(field, { message });
          setFocus(field);
        },
        onSuccess: () => {
          router.push(redirectTo || `/${data.username}`);
        },
      },
    );
  };
  // eslint-disable-next-line no-console
  const onInvalid: SubmitErrorHandler<UserAboutSchema> = (errors) => console.log(errors);
  const resetForm = useCallback(() => reset(defaultValues), [reset, defaultValues]);

  useEffect(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  if (!userData) return <GenericLoading>加载表单中</GenericLoading>;
  return (
    <div>
      <form onSubmit={handleSubmit(onValid, onInvalid)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <TextInput
                label="用户名 *"
                value={value}
                onChange={(v) => onChange(v)}
                errorMessage={error?.message}
                ref={ref}
                Icon={AtSign}
              />
            </div>
          )}
        />

        {/* <Controller
          control={control}
          name="email"
          render={({
            field: { onChange, ref, value },
            fieldState: { error },
          }) => (
            <div>
              <TextInput
                label="Email *"
                value={value}
                onChange={(value) => onChange(value)}
                errorMessage={error?.message}
                ref={ref}
                Icon={Mail}
              />
            </div>
          )}
        /> */}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <TextInput
                label="姓名 *"
                value={value}
                onChange={(v) => onChange(v)}
                errorMessage={error?.message}
                ref={ref}
                Icon={Profile}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <TextInput
                label="手机号码"
                value={value || ''}
                onChange={(v) => onChange(v || null)}
                errorMessage={error?.message}
                ref={ref}
                Icon={Phone}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <Textarea
                label="个人简介"
                value={value || ''}
                onChange={(v) => onChange(v || null)}
                errorMessage={error?.message}
                ref={ref}
                Icon={Bullhorn}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <TextInput
                label="网站"
                value={value || ''}
                onChange={(v) => onChange(v || null)}
                errorMessage={error?.message}
                ref={ref}
                Icon={WorldNet}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <TextInput
                label="地址"
                value={value || ''}
                onChange={(v) => onChange(v || null)}
                errorMessage={error?.message}
                ref={ref}
                Icon={BuildingBusinessOffice}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <Select
                label="性别"
                name="gender"
                selectedKey={value || null}
                onSelectionChange={(key) => onChange(key || null)}
                errorMessage={error?.message}
                ref={ref}
                Icon={Other}>
                <Item key="MALE">男</Item>
                <Item key="FEMALE">女</Item>
                <Item key="NONBINARY">非二元性别</Item>
              </Select>
            </div>
          )}
        />

        <Controller
          control={control}
          name="relationshipStatus"
          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
            <div>
              <Select
                label="感情状态"
                name="relationshipStatus"
                selectedKey={value || null}
                onSelectionChange={(key) => onChange(key || null)}
                errorMessage={error?.message}
                Icon={Heart}
                ref={ref}>
                <Item key="SINGLE">单身</Item>
                <Item key="IN_A_RELATIONSHIP">恋爱中</Item>
                <Item key="ENGAGED">已订婚</Item>
                <Item key="MARRIED">已婚</Item>
              </Select>
            </div>
          )}
        />

        {/* This DatePicker is not controlled */}
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, ref }, fieldState: { error } }) => (
            <div>
              <DatePicker
                label="出生日期"
                defaultValue={
                  userData.birthDate &&
                  parseDate(
                    formatISO(new Date(userData.birthDate), {
                      representation: 'date',
                    }),
                  )
                }
                onChange={(value) => {
                  onChange(value?.toString() ?? null);
                }}
                errorMessage={error?.message}
                triggerRef={ref}
              />
            </div>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            mode="secondary"
            type="button"
            loading={updateSessionUserDataMutation.isPending === true}
            onPress={resetForm}>
            重置
          </Button>
          <Button type="submit" loading={updateSessionUserDataMutation.isPending === true}>
            提交
          </Button>
        </div>
      </form>
    </div>
  );
}
