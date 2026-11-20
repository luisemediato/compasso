import { isValidSlug } from './validation.js';

const pagePaths = {
  home: '/',
  explore: '/explorar',
  dashboard: '/painel',
  profile: '/perfil',
  works: '/trabalhos',
  agenda: '/agenda',
  publication: '/publicacao',
  preview: '/previa',
  login: '/entrar',
  register: '/cadastro',
  contact: '/contato',
};

const routesByPath = new Map(
  Object.entries(pagePaths).map(([route, path]) => [path, route])
);

export function routeFromPath(path) {
  if (routesByPath.has(path)) {
    return routesByPath.get(path);
  }

  if (typeof path !== 'string' || !path.startsWith('/')) {
    return null;
  }

  const slug = path.slice(1);
  return isValidSlug(slug) ? `artist/${slug}` : null;
}

export function pathFromRoute(route) {
  if (typeof route !== 'string') {
    return '/';
  }

  if (Object.hasOwn(pagePaths, route)) {
    return pagePaths[route];
  }

  if (!route.startsWith('artist/')) {
    return '/';
  }

  const slug = route.slice('artist/'.length);
  const path = `/${slug}`;

  if (!isValidSlug(slug) || routesByPath.has(path)) {
    return '/';
  }

  return path;
}

export function resolveRoute(path) {
  return routeFromPath(path);
}
