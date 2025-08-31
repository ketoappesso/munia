export const getAvatarFallback = (name: string) => {
  if (!name) {
    return '';
  }
  return name
    .split(' ')
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
};
