import { selectPost } from '@/lib/prisma/selectPost';
import { formDataToObject } from '@/lib/formDataToObject';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';
import { GetPost } from '@/types/definitions';
import { isValidFileType } from '@/lib/isValidFileType';
import { postWriteSchema } from '@/lib/validations/post';
import { z } from 'zod';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { getServerUser } from '@/lib/getServerUser';
import { convertMentionUsernamesToIds } from '@/lib/convertMentionUsernamesToIds';
import { mentionsActivityLogger } from '@/lib/mentionsActivityLogger';
import { deleteObject } from '@/lib/s3/deleteObject';
import { savePostFiles } from '@/lib/s3/savePostFiles';
import { verifyAccessToPost } from '@/app/api/posts/[postId]/verifyAccessToPost';
import { generateTtsAudio } from '@/lib/tts';
import { uploadAudio } from '@/lib/tos';

// If `type` is `edit`, then the `postId` is required
type Props =
  | {
      formData: FormData;
      type: 'create';
      postId?: undefined;
    }
  | {
      formData: FormData;
      type: 'edit';
      postId: number;
    };

export async function serverWritePost({ formData, type, postId }: Props) {
  console.log('[serverWritePost] Starting with type:', type);
  const [user] = await getServerUser();
  console.log('[serverWritePost] User from session:', user);
  if (!user) {
    console.error('[serverWritePost] No user found in session');
    return NextResponse.json({}, { status: 401 });
  }
  const userId = user.id;
  console.log('[serverWritePost] User ID:', userId);

  if (type === 'edit') {
    if (!verifyAccessToPost(postId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  try {
    const body = postWriteSchema.parse(formDataToObject(formData));

    const { content, files } = body;

    // Task/Reward fields (optional)
    const isTask = formData.get('isTask') === 'true';
    const rewardAmountStr = formData.get('rewardAmount');
    const rewardAmount = typeof rewardAmountStr === 'string' ? parseFloat(rewardAmountStr) : 0;
    const { str, usersMentioned } = await convertMentionUsernamesToIds({
      str: content || '',
    });
    const filesArr = !files ? [] : Array.isArray(files) ? files : [files];

    // Validate if files are valid
    for (const file of filesArr) {
      if (typeof file === 'string') continue;
      if (!isValidFileType(file.type)) {
        return NextResponse.json({ error: 'Invalid file type.' }, { status: 415 });
      }
    }
    const savedFiles = await savePostFiles(filesArr);

    if (type === 'create') {
      // If creating a task, check user balance and deduct commission immediately
      if (isTask && rewardAmount > 0) {
        const userBalance = await prisma.user.findUnique({
          where: { id: userId },
          select: { apeBalance: true },
        });
        
        if (!userBalance || userBalance.apeBalance < rewardAmount) {
          return NextResponse.json({ 
            error: `余额不足。需要 ${rewardAmount} APE，当前余额：${userBalance?.apeBalance || 0} APE` 
          }, { status: 400 });
        }
      }
      
      // Use transaction to ensure atomicity
      const res = await prisma.$transaction(async (tx) => {
        // Create the post
        const post = await tx.post.create({
          data: {
            content: str,
            isTask: isTask || undefined,
            rewardAmount: isTask ? rewardAmount : 0,
            taskStatus: isTask ? 'OPEN' : undefined,
            ...(files !== undefined && {
              visualMedia: {
                create: savedFiles.map((savedFile) => ({
                  type: savedFile.type,
                  fileName: savedFile.fileName,
                  user: { connect: { id: userId } },
                })),
              },
            }),
            userId,
          },
          select: selectPost(userId),
        });
        
        // If it's a task, deduct the commission from user's balance immediately
        if (isTask && rewardAmount > 0) {
          // Deduct from user balance
          await tx.user.update({
            where: { id: userId },
            data: {
              apeBalance: {
                decrement: rewardAmount,
              },
            },
          });
          
          // Create wallet transaction record
          await tx.walletTransaction.create({
            data: {
              type: 'TASK_POST',
              amount: rewardAmount,
              status: 'COMPLETED',
              description: `发布悬赏任务 - ${str?.substring(0, 50)}`,
              fromUserId: userId,
              toUserId: userId, // Initially held by system
              completedAt: new Date(),
            },
          });
        }
        
        return post;
      });

      // Log the 'POST_MENTION' activity if applicable
      await mentionsActivityLogger({
        usersMentioned,
        activity: {
          type: 'POST_MENTION',
          sourceUserId: userId,
          sourceId: res.id,
        },
        isUpdate: false,
      });

      // Check if user has featured status and TTS configuration for audio generation
      console.log('[serverWritePost] Checking user TTS configuration for userId:', userId);
      const userTtsConfig = await prisma.user.findUnique({
        where: { id: userId },
        select: { featured: true, ttsModelId: true, ttsVoiceId: true },
      });
      console.log('[serverWritePost] User TTS config:', userTtsConfig);
      
      if (userTtsConfig?.featured && userTtsConfig.ttsModelId && userTtsConfig.ttsVoiceId && str) {
        try {
          console.log('[serverWritePost] User is featured with TTS config, starting audio generation');
          console.log('[serverWritePost] Post content for TTS:', str.substring(0, 100) + '...');
          console.log('[serverWritePost] Using voice ID:', userTtsConfig.ttsVoiceId);
          
          // Generate TTS audio
          const tempFilePath = await generateTtsAudio(str, userTtsConfig.ttsVoiceId);
          console.log('[serverWritePost] TTS audio generated successfully at:', tempFilePath);
          
          // Upload audio to TOS
          const audioUrl = await uploadAudio(tempFilePath);
          console.log('[serverWritePost] Audio uploaded to TOS successfully:', audioUrl);
          
          // Update post with audio URL
          const updatedPost = await prisma.post.update({
            where: { id: res.id },
            data: { audioUrl },
          });
          console.log('[serverWritePost] Post updated with audio URL successfully. Post ID:', res.id);
          console.log('[serverWritePost] Updated post audioUrl field:', updatedPost.audioUrl);
          
        } catch (audioError) {
          // Don't fail the post creation if audio generation fails
          console.error('[serverWritePost] Audio generation/upload failed:', audioError);
          console.error('[serverWritePost] Audio error stack:', (audioError as Error).stack);
        }
      } else {
        console.log('[serverWritePost] Skipping TTS audio generation. Reasons:');
        console.log('  - User featured:', userTtsConfig?.featured);
        console.log('  - TTS Model ID:', userTtsConfig?.ttsModelId);
        console.log('  - TTS Voice ID:', userTtsConfig?.ttsVoiceId);
        console.log('  - Content available:', !!str);
      }

      return NextResponse.json<GetPost>(await toGetPost(res));
    }

    // if (type === 'edit')
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
      select: {
        visualMedia: true,
      },
    });

    // If there are previously associated `visuaMedia` files
    if (post && post.visualMedia.length > 0) {
      // Delete files that are no longer needed from the S3 bucket
      const savedFileNames = savedFiles.map(({ fileName }) => fileName);
      const filesToDelete = post.visualMedia.filter(
        // If the `fileName` is not included in `savedFileNames`, it must be deleted
        ({ fileName }) => !savedFileNames.includes(fileName),
      );
      for (const { fileName } of filesToDelete) {
        // eslint-disable-next-line no-await-in-loop
        await deleteObject(fileName);
      }

      // Delete the related `visuaMedia` record to avoid duplicating the records
      // as the next step will write the `savedFiles` into the `post`
      await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          visualMedia: {
            deleteMany: {},
          },
        },
      });
    }

    const res = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        content: str,
        ...(files !== undefined && {
          visualMedia: {
            create: savedFiles.map((savedFile) => ({
              type: savedFile.type,
              fileName: savedFile.fileName,
              userId,
            })),
          },
        }),
        ...(files === undefined && {
          visualMedia: {
            deleteMany: {},
          },
        }),
      },
      select: selectPost(userId),
    });

    // Log the 'POST_MENTION' activity if applicable
    await mentionsActivityLogger({
      usersMentioned,
      activity: {
        type: 'POST_MENTION',
        sourceUserId: userId,
        sourceId: res.id,
      },
      isUpdate: true,
    });

    return NextResponse.json<GetPost>(await toGetPost(res));
  } catch (error) {
    console.error('[serverWritePost] Error occurred:', error);
    if (error instanceof z.ZodError) {
      console.error('[serverWritePost] Validation error:', error.issues);
      return NextResponse.json(null, {
        status: 422,
        statusText: error.issues[0].message,
      });
    }

    console.error('[serverWritePost] Unexpected error:', error);
    return NextResponse.json({ error: 'Error creating post.' }, { status: 500 });
  }
}
