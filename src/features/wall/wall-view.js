import { createPostComposer } from '../posts/post-composer.js';
import { createPostList } from '../posts/post-list.js';
import { renderAvatar } from '../../shared/ui/avatar.js';
import { escapeHtml } from '../../shared/utils/escape-html.js';
import { renderUserLink } from '../../shared/utils/render-rich-text.js';
import { isCreator } from '../users/roles.js';

/** Представление стены пользователя: /wall/:userId. */
export function createWallView({ store, usersService, postsService, userId }) {
  const user = usersService.getUserById(userId);
  const composer = createPostComposer({
    postsService,
    wallOwnerId: user.id,
    placeholder: `Написать на стене @${user.handle}`,
  });

  const postList = createPostList({
    getPosts: () => postsService.listByWall(user.id),
    usersService,
    postsService,
    store,
    emptyMessage: 'На этой стене пока нет постов.',
  });

  const html = `
    <section class="wall">
      <header class="wall__header">
        ${renderAvatar(user, 'large')}
        <div class="wall__info">
          <h1 class="wall__name">${escapeHtml(user.name)}</h1>
          <p class="wall__handle">${renderUserLink(user)}${isCreator(user) ? '<span class="role-badge">Создатель</span>' : ''}</p>
        </div>
        <a class="wall__back" href="#/feed">← В ленту</a>
      </header>

      <div class="wall__composer">${composer.html}</div>

      <h2 class="feed__title">Посты на стене</h2>
      <div class="feed__list" data-wall-posts></div>
    </section>
  `;

  function mount(root) {
    const cleanups = [
      postList.mount(root.querySelector('[data-wall-posts]')),
      composer.mount(root.querySelector('.wall__composer')),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }

  return { html, mount };
}
