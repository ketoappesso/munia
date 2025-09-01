/**
 * Use this function to convert the returned user from a prisma
 * query that uses the `includeToUser()` function to the GetUser
 * type.
 */

import { FindUserResult, GetUser } from '@/types/definitions';
import { fileNameToUrl } from '../s3/fileNameToUrl';

export const toGetUser = (findUserResult: FindUserResult): GetUser => {
  const followerCount = findUserResult?._count.followers || 0;
  const followingCount = findUserResult?._count.following || 0;

  // Exclude `followers` and `count` as they're not required
  // in `GetUser`. The `rest` below contains the properties
  // of the `User` type of @prisma/client.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { followers, _count, ...rest } = findUserResult;

  const userResponse: GetUser = {
    ...rest,
    // For phone-registered users, name might be null, so we use username or phoneNumber as fallback
    name: rest.name || rest.username || rest.phoneNumber || '用户',
    username: rest.username || rest.phoneNumber || rest.id,
    // Convert the `profilePhoto` and `coverPhoto` file names to a full S3 URL
    profilePhoto: fileNameToUrl(rest.profilePhoto),
    coverPhoto: fileNameToUrl(rest.coverPhoto),
    followerCount,
    followingCount,
    isFollowing: findUserResult?.followers.length === 1,
  };

  return userResponse;
};
