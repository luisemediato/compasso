const PROFILE_FIELDS = new Set(['name', 'instrument', 'city', 'headline', 'bio', 'email', 'instagram']);

export function safeUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
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
  if (profile.instagram?.trim() && !safeUrl(profile.instagram)) return 'Informe um link HTTP ou HTTPS.';
  return '';
}

const RESERVED_SLUGS = new Set(['entrar', 'cadastro']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return typeof slug === 'string'
    && SLUG_PATTERN.test(slug)
    && !RESERVED_SLUGS.has(slug);
}
