/**
 * PATCH /api/users/:userId
 * Allows an authenticated user to update their information.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { Prisma } from '@prisma/client';
import { getServerUser } from '@/lib/getServerUser';
import { userAboutSchema } from '@/lib/validations/userAbout';

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const [user] = await getServerUser();
    if (!user || user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAbout = await request.json();
    const validate = userAboutSchema.safeParse(userAbout);

    if (!validate.success) {
      return NextResponse.json(
        { errorMessage: validate.error.issues[0].message },
        { status: 400 }
      );
    }

    // Filter out any extra fields that shouldn't be in the database update
    const { username, name, phoneNumber, bio, website, address, gender, relationshipStatus, birthDate } = validate.data;

    // Simple update without complex includes
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        username,
        name,
        phoneNumber,
        bio,
        website,
        address,
        gender,
        relationshipStatus,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phoneNumber: true,
        gender: true,
        birthDate: true,
        address: true,
        bio: true,
        website: true,
        relationshipStatus: true,
        profilePhoto: true,
        coverPhoto: true,
        punked: true,
        ttsVoiceId: true,
        _count: {
          select: {
            followers: true,
            following: true,
          }
        }
      }
    });

    // Return the updated user data
    return NextResponse.json({
      ...updatedUser,
      followersCount: updatedUser._count.followers,
      followingCount: updatedUser._count.following,
      isFollowing: false // Will be updated by client-side query
    });

  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = (error.meta?.target as string[])?.[0] || 'field';
        return NextResponse.json(
          { field, message: `This ${field} is already taken.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { errorMessage: 'Database error occurred.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { errorMessage: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}