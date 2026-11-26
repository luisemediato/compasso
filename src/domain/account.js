export { draftError } from './draft.js';
import { hasEmailFormat, isValidSlug } from './validation.js';
export const MIN_PASSWORD_LENGTH = 9;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_SLUG_LENGTH = 60;

export function suggestSlug(artistName) {
  const slug = artistName.normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/, '');
  if (!slug || isValidSlug(slug)) return slug;
  return slug + '-musica';
}

function isValidName(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= 120;
}

export function accountError({ fullName, name, email, password, slug } = {}) {
  if (!isValidName(fullName) || !isValidName(name)) {
    return 'Informe seu nome e seu nome artístico (até 120 caracteres).';
  }

  if (!hasEmailFormat(email) || email.length > 254) {
    return 'Informe um e-mail válido.';
  }

  if (
    typeof password !== 'string'
    || password.length < MIN_PASSWORD_LENGTH
    || password.length > MAX_PASSWORD_LENGTH
    || !/[\p{P}\p{S}]/u.test(password)
  ) {
    return `Use uma senha de ${MIN_PASSWORD_LENGTH} a ${MAX_PASSWORD_LENGTH} caracteres com pelo menos um caractere especial.`;
  }

  if (!isValidSlug(slug) || slug.length > MAX_SLUG_LENGTH) {
    return 'Escolha outro endereço, com até 60 letras minúsculas, números e hífens.';
  }

  return '';
}

export function newDraft(name) {
  return {
    profile: {
      name,
      instrument: '',
      city: '',
      headline: '',
      bio: '',
      email: '',
      instagram: '',
    },
    events: [],
    works: [],
  };
}