/**
 * Use this function when searching posts from a given
 * `search` query string parameter.
 *
 * @param search The search query string.
 * @returns filters based on the given search string
 */
export function searchPost(search: string) {
  const searchTerm = search.trim();
  return {
    OR: [
      { content: { contains: searchTerm } },
      { user: { name: { contains: searchTerm } } },
      { user: { username: { contains: searchTerm } } },
    ],
  };
}
