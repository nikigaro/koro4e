import { createPostComposer } from './post-composer.js';
import { createPostList } from './post-list.js';
import { createNewsPanel } from '../news/news-panel.js';

/** Представление общей ленты. */
export function createFeedView({ store, usersService, postsService, newsService }) {
  const composer = createPostComposer({ postsService });
  const newsPanel = createNewsPanel({ store, newsService });
  const postList = createPostList({
    getPosts: () => postsService.list(),
    usersService,
    postsService,
    store,
    emptyMessage: 'Пока тихо. Напиши первый пост ✍️',
  });

  const html = `
    <div class="feed-layout">
      ${newsPanel.html}
      <section class="feed">
        <div class="feed__composer">${composer.html}</div>
        <h2 class="feed__title">Лента</h2>
        <div class="feed__list" data-feed-posts></div>
      </section>
    </div>
  `;

  function mount(root) {
    const cleanupComposer = composer.mount(root.querySelector('.feed__composer'));
    const cleanupList = postList.mount(root.querySelector('[data-feed-posts]'));
    const cleanupNews = newsPanel.mount(root);

    return () => {
      cleanupComposer();
      cleanupList();
      cleanupNews();
    };
  }

  return { html, mount };
}
