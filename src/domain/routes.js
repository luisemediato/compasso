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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_PATTERN.test(slug) && !routesByPath.has('/' + slug);
}

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

  if (!isValidSlug(slug)) {
    return '/';
  }

  return path;
}

export function resolveRoute(path) {
  return routeFromPath(path);
}
