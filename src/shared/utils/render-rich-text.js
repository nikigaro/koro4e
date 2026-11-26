import { escapeHtml } from './escape-html.js';

/**
 * Текст поста или сообщения: переносы строк, теги и ссылки на пользователей по @нику.
 * Ники превращаются в ссылки только если такой пользователь существует.
 */
export function renderRichText(text, users = [], { tags = false } = {}) {
  let html = escapeHtml(text).replace(/\n/g, '<br />');

  if (tags) {
    html = html.replace(/#([\p{L}\p{N}_]+)/gu, '<span class="post__tag">#$1</span>');
  }

  const byHandle = new Map(users
    .filter((user) => user?.handle)
    .map((user) => [String(user.handle).toLowerCase(), user]));

  return html.replace(/(^|[\s(>])@([\p{L}\p{N}_]+)/gu, (match, prefix, handle) => {
    const user = byHandle.get(handle.toLowerCase());
    if (!user) return match;
    return `${prefix}<a class="mention" href="#/wall/${encodeURIComponent(user.id)}">@${escapeHtml(user.handle)}</a>`;
  });
}

/** Ссылка на профиль пользователя по нику. */
export function renderUserLink(user, className = 'user-link') {
  if (!user?.handle) return '';
  return `<a class="${escapeHtml(className)}" href="#/wall/${encodeURIComponent(user.id)}">@${escapeHtml(user.handle)}</a>`;
}
