import { z } from 'zod';

const passwordSchema = z.string().min(6, { message: '密码必须至少6个字符' });

export const passwordResetSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '确认密码与新密码不匹配',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密码不能与当前密码相同',
    path: ['newPassword'],
  });

export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;