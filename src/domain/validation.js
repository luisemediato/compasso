const PROFILE_FIELDS = new Set(['name', 'instrument', 'city', 'headline', 'bio', 'email', 'instagram']);

export function validateWork(work) {
  if (typeof work?.title !== 'string' || !work.title.trim()) return 'Informe o título do trabalho.';
  if (!safeUrl(work.url)) return 'Informe um link HTTP ou HTTPS para o trabalho.';
  return '';
}

export function safeUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

const INSTAGRAM_ROUTES = new Set([
  'accounts', 'about', 'developer', 'developers', 'direct', 'directory', 'emails',
  'explore', 'legal', 'p', 'press', 'privacy', 'reel', 'reels', 'share', 'stories', 'tv', 'web',
]);

export function normalizeInstagram(input) {
  if (typeof input !== 'string') return '';
  const value = input.trim();
  let username = value.replace(/^@/, '');

  if (/^https?:\/\//i.test(value)) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return '';
    }
    if (!['instagram.com', 'www.instagram.com'].includes(url.hostname)
        || url.username || url.password || url.port) return '';
    const match = /^\/([a-z0-9._]+)\/?$/i.exec(url.pathname);
    if (!match) return '';
    username = match[1];
  }

  username = username.toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(username) || username.startsWith('.')
      || username.endsWith('.') || username.includes('..') || INSTAGRAM_ROUTES.has(username)) {
    return '';
  }
  return `https://www.instagram.com/${username}/`;
}

export function validateProfile(profile, { requireInstrument = true } = {}) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return 'Perfil inválido.';
  for (const [field, value] of Object.entries(profile)) {
    if (!PROFILE_FIELDS.has(field) || typeof value !== 'string' || value.length > 4000) {
      return 'Campo de perfil inválido.';
    }
  }
  if (!profile.name?.trim()) return 'Informe seu nome artístico.';
  if (requireInstrument && !profile.instrument?.trim()) return 'Informe seu instrumento.';
  if (profile.bio?.length > 3000) return 'Use até 3000 caracteres na trajetória.';
  const email = profile.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Informe um e-mail válido.';
  if (profile.instagram?.trim() && !normalizeInstagram(profile.instagram)) return 'Informe o usuário ou o link de perfil do Instagram.';
  return '';
}

const RESERVED_SLUGS = new Set(['entrar', 'cadastro']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return typeof slug === 'string'
    && SLUG_PATTERN.test(slug)
    && !RESERVED_SLUGS.has(slug);
}
