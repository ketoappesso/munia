import 'server-only';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { v4 as uuid } from 'uuid';
import { uploadObject } from '@/lib/tos/uploadObject';
import { fileNameToUrl } from '@/lib/tos/fileNameToUrl';
import { getServerUser } from '@/lib/getServerUser';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export async function useUpdateProfileAndCoverPhoto({
  request,
  userIdParam,
  toUpdate,
}: {
  request: Request;
  userIdParam: string;
  toUpdate: 'profilePhoto' | 'coverPhoto';
}) {
  const [user] = await getServerUser();
  if (!user || user.id !== userIdParam) {
    return NextResponse.json({}, { status: 401 });
  }
  const userId = user.id;

  const formData = await request.formData();
  const file = formData.get('file') as Blob | null;

  if (!file) {
    return NextResponse.json({ error: 'File blob is required.' }, { status: 400 });
  }

  try {
    const fileExtension = file.type.split('/')[1];
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    // Upload image to TOS
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${uuid()}.${fileExtension}`;
    await uploadObject({ key: fileName, body: buffer, contentType: file.type });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        [toUpdate]: fileName,
      },
    });

    await prisma.post.create({
      data: {
        userId,
        content: toUpdate === 'profilePhoto' ? '我有新的头像啦！' : '新背景图酷不酷啊？',
        visualMedia: {
          create: [
            {
              userId,
              fileName,
              type: 'PHOTO',
            },
          ],
        },
      },
    });

    const uploadedTo = fileNameToUrl(fileName);

    return NextResponse.json({ uploadedTo });
  } catch (error) {
    console.error(`Error updating ${toUpdate}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Server error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
