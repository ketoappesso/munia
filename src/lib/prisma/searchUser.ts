/**
 * Use this function when searching a user from a given
 * `search` query string parameter. The return type was explicitly
 * provided to stop prisma type-checking from complaining.
 *
 * @param search The search query string.
 * @returns filters based on the given search string
 */
export function searchUser(search: string):
  | {
      OR?: (
        | {
            name: {
              contains: string;
              mode: 'insensitive';
            };
          }
        | {
            name: {
              startsWith: string;
              mode: 'insensitive';
            };
          }
        | {
            username: {
              startsWith: string;
              mode: 'insensitive';
            };
          }
      )[];
    }
  | undefined {
  return {
    OR: [
      {
        name: {
          contains: search.trim(),
          mode: 'insensitive',
        },
      },
      {
        name: {
          startsWith: search.trim(),
          mode: 'insensitive',
        },
      },
      {
        username: {
          startsWith: search.trim(),
          mode: 'insensitive',
        },
      },
    ],
  };
}
