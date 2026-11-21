const RESERVED_SLUGS = new Set(['entrar', 'cadastro']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return typeof slug === 'string'
    && SLUG_PATTERN.test(slug)
    && !RESERVED_SLUGS.has(slug);
}
