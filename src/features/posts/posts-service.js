import { createId } from '../../shared/utils/create-id.js';
import { isCreator } from '../users/roles.js';

export const MAX_POST_LENGTH = 280;

/** Бизнес-логика постов: единственное место, которое меняет посты в store. */
export function createPostsService({ store, usersService }) {
  function list() {
    return store.getState().posts;
  }

  function listByAuthor(authorId) {
    return list().filter((post) => post.authorId === authorId);
  }

  /** Посты на стене пользователя, в том числе написанные другими. */
  function listByWall(userId) {
    return list().filter((post) => (post.wallOwnerId ?? post.authorId) === userId);
  }

  function add(text, attachments = [], wallOwnerId = null) {
    const cleanText = String(text ?? '').trim();
    const safeAttachments = Array.isArray(attachments) ? attachments.slice(0, 4) : [];
    if ((!cleanText && safeAttachments.length === 0) || cleanText.length > MAX_POST_LENGTH) return null;

    const author = usersService.getCurrentUser();
    if (!author) return null;

    const ownerId = usersService.listUsers().some((user) => user.id === wallOwnerId)
      ? wallOwnerId
      : author.id;

    const post = {
      id: createId('post'),
      authorId: author.id,
      wallOwnerId: ownerId,
      text: cleanText,
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
      attachments: safeAttachments,
    };

    store.setState((state) => ({ ...state, posts: [post, ...state.posts] }));
    return post;
  }

  function toggleLike(id) {
    store.setState((state) => ({
      ...state,
      posts: state.posts.map((post) => post.id === id
        ? { ...post, likedByMe: !post.likedByMe, likes: post.likes + (post.likedByMe ? -1 : 1) }
        : post),
    }));
  }

  function remove(id) {
    const me = usersService.getCurrentUser();
    const post = list().find((item) => item.id === id);
    if (!me || !post) return false;
    if (post.authorId !== me.id && !isCreator(me)) return false;

    store.setState((state) => ({
      ...state,
      posts: state.posts.filter((item) => item.id !== id),
    }));
    return true;
  }

  return { list, listByAuthor, listByWall, add, toggleLike, remove };
}
