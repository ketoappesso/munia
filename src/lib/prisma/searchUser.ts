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
            };
          }
        | {
            name: {
              startsWith: string;
            };
          }
        | {
            username: {
              startsWith: string;
            };
          }
      )[];
    }
  | undefined {
  const searchTerm = search.trim();
  return {
    OR: [
      {
        name: {
          contains: searchTerm,
        },
      },
      {
        name: {
          startsWith: searchTerm,
        },
      },
      {
        username: {
          startsWith: searchTerm,
        },
      },
    ],
  };
}
