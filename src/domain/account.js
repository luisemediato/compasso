export { draftError } from './draft.js';
import { hasEmailFormat, isValidSlug } from './validation.js';
export function suggestSlug(artistName) {
  return artistName
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
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
    || password.length < 8
    || password.length > 128
    || !/[\p{P}\p{S}]/u.test(password)
  ) {
    return 'Use uma senha de 8 a 128 caracteres com pelo menos um caractere especial.';
  }

  if (!isValidSlug(slug) || slug.length > 60) {
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