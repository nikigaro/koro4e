import { renderPostCard } from './post-card.js';
import { renderEmptyState } from '../../shared/ui/empty-state.js';

/**
 * Переиспользуемый список постов: рендер, делегирование событий и подписка на store.
 * Используется и в ленте, и на стене пользователя.
 */
export function createPostList({ getPosts, usersService, postsService, store, emptyMessage }) {
  function render() {
    const posts = getPosts();
    if (posts.length === 0) return renderEmptyState(emptyMessage);

    return posts
      .map((post) => renderPostCard({
        post,
        author: usersService.getUserById(post.authorId),
        wallOwner: post.wallOwnerId ? usersService.getUserById(post.wallOwnerId) : null,
        users: usersService.listUsers(),
      }))
      .join('');
  }

  function mount(container) {
    container.innerHTML = render();

    function handleClick(event) {
      const button = event.target.closest('[data-action]');
      if (!button || !container.contains(button)) return;

      const { action, id } = button.dataset;
      if (action === 'like') postsService.toggleLike(id);
      if (action === 'delete' && window.confirm('Удалить пост?')) postsService.remove(id);
    }

    function handleStoreChange() {
      container.innerHTML = render();
    }

    container.addEventListener('click', handleClick);
    const unsubscribe = store.subscribe(handleStoreChange);

    return () => {
      unsubscribe();
      container.removeEventListener('click', handleClick);
    };
  }

  return { mount };
}
