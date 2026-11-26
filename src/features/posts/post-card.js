import { renderAvatar } from '../../shared/ui/avatar.js';
import { escapeHtml } from '../../shared/utils/escape-html.js';
import { formatTime } from '../../shared/utils/format-time.js';
import { renderAttachment } from './attachments.js';
import { renderRichText } from '../../shared/utils/render-rich-text.js';

/** Чистая функция: пост + автор -> HTML карточки. Никаких сайд-эффектов. */
export function renderPostCard({ post, author, wallOwner, users = [] }) {
  const text = renderRichText(post.text, users, { tags: true });
  const wallUrl = `#/wall/${encodeURIComponent(author.id)}`;
  const isoDate = new Date(post.createdAt).toISOString();
  const hypeLabel = post.likedByMe ? 'Убрать хайп' : 'Поставить хайп';
  const wallNote = post.wallOwnerId && post.wallOwnerId !== post.authorId && wallOwner?.handle
    ? `<span class="post__dot">·</span><span class="post__wall">на стене <a class="mention" href="#/wall/${encodeURIComponent(wallOwner.id)}">@${escapeHtml(wallOwner.handle)}</a></span>`
    : '';

  return `
    <article class="post" data-post-id="${escapeHtml(post.id)}">
      ${renderAvatar(author)}
      <div class="post__body">
        <header class="post__meta">
          <a class="post__author" href="${wallUrl}">@${escapeHtml(author.handle)}</a>
          ${wallNote}
          <span class="post__dot">·</span>
          <time class="post__time" datetime="${isoDate}">${escapeHtml(formatTime(post.createdAt))}</time>
        </header>
        <p class="post__text">${text}</p>
        ${post.attachments?.length
          ? `<div class="post__attachments">${post.attachments.map(renderAttachment).join('')}</div>`
          : ''}
        <footer class="post__actions">
          <button
            class="action action--like ${post.likedByMe ? 'is-liked' : ''}"
            type="button"
            data-action="like"
            data-id="${escapeHtml(post.id)}"
            aria-pressed="${post.likedByMe}"
            aria-label="${hypeLabel}"
            title="ХАЙП"
          >
            <img class="action--like__icon" src="assets/icons/xd-hype.png" alt="" aria-hidden="true" />
            <span>${post.likes}</span>
          </button>
          <button
            class="action action--delete"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(post.id)}"
            aria-label="Удалить пост"
          >
            Удалить
          </button>
        </footer>
      </div>
    </article>
  `;
}
