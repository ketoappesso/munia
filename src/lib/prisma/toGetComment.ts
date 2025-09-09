import { FindCommentResult, GetComment } from '@/types/definitions';
import { convertMentionUsernamesToIds } from '../convertMentionUsernamesToIds';
import { fileNameToUrl } from '../tos/fileNameToUrl';

export async function toGetComment(findCommentResult: FindCommentResult): Promise<GetComment> {
  const { commentLikes, content, ...rest } = findCommentResult;
  const isLiked = commentLikes.length > 0;

  // Convert the `@` `id` mentions back to usernames
  const { str } = await convertMentionUsernamesToIds({
    str: content,
    reverse: true,
  });
  return {
    ...rest,
    user: {
      id: rest.user.id,
      // For phone-registered users, name might be null, so we use username as fallback
      username: rest.user.username || rest.user.id,
      name: rest.user.name || rest.user.username || '用户',
      // Convert the `profilePhoto` file name to a full S3 URL
      profilePhoto: fileNameToUrl(rest.user.profilePhoto),
    },
    isLiked,
    content: str,
  };
}
