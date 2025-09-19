/**
 * PATCH /api/users/:userId/password
 * Updates a user's password after verifying their current password.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma/prisma';
import { getServerUser } from '@/lib/getServerUser';
import { passwordResetSchema } from '@/lib/validations/passwordReset';

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const [user] = await getServerUser();
    if (!user || user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = passwordResetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          field: validation.error.issues[0].path[0],
          message: validation.error.issues[0].message
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true }
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      return NextResponse.json(
        { field: 'currentPassword', message: '用户没有设置密码' },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { field: 'currentPassword', message: '当前密码不正确' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword }
    });

    return NextResponse.json({ message: '密码已成功更新' });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: '更新密码时发生错误' },
      { status: 500 }
    );
  }
}