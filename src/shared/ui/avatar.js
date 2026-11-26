import { escapeHtml } from '../utils/escape-html.js';

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Общий аватар: картинка для зарегистрированных, инициалы для остальных. */
export function renderAvatar(user, size = 'normal') {
  const initials = escapeHtml(getInitials(user.name));
  const color = escapeHtml(user.color);
  const isImage = Boolean(user.avatar);

  const content = isImage
    ? `<img class="avatar__image" src="${escapeHtml(user.avatar)}" alt="" />`
    : initials;

  const online = user.isOnline === true;

  return `<span class="avatar avatar--${size}${isImage ? ' avatar--image' : ''} avatar--${online ? 'online' : 'offline'}" style="--avatar-color: ${color}" aria-hidden="true">${content}</span>`;
}
