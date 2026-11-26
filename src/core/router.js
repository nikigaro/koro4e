/**
 * Hash-роутер без зависимостей.
 * Поддерживает динамические сегменты вида '/wall/:userId'.
 * Каждый маршрут является фабрикой представлений, параметры доступны сразу.
 */

function normalizePath(hash) {
  const raw = (hash || '').replace(/^#/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(pathParts[index]);
    } else if (part !== pathParts[index]) {
      return null;
    }
  }
  return params;
}

export function createRouter({ routes, fallback = '/feed', render }) {
  let currentKey = null;
  let cleanupCurrent = null;

  function resolve(path) {
    for (const [pattern, createView] of Object.entries(routes)) {
      const params = matchRoute(pattern, path);
      if (params) return { createView, params };
    }
    return null;
  }

  function handleRoute() {
    const path = normalizePath(location.hash);
    const match = resolve(path);

    if (!match) {
      // Защита от рекурсии, если и fallback не найден.
      if (path !== normalizePath(fallback)) navigate(fallback);
      return;
    }

    const key = `${path}:${JSON.stringify(match.params)}`;
    if (key === currentKey) return;

    currentKey = key;
    if (typeof cleanupCurrent === 'function') cleanupCurrent();

    const view = match.createView(match.params);
    cleanupCurrent = render(view, path) ?? null;
  }

  function navigate(path) {
    const nextHash = `#${normalizePath(path)}`;
    if (location.hash !== nextHash) location.hash = nextHash;
    else handleRoute();
  }

  function start() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  return { start, navigate };
}
