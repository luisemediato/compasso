export function suggestSlug(artistName) {
  return artistName
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}
