import { seedUsers } from '../features/users/users-seed.js';
import { seedPosts } from '../features/posts/posts-seed.js';
import { seedNews } from '../features/news/news-seed.js';

const STORAGE_KEY = 'koroche.state.v1';

// Стартовые аккаунты, которые были ботами. Убираем их и всё, что с ними связано.
const REMOVED_USER_IDS = new Set(['u-anya', 'u-mark']);

function createInitialState() {
  return {
    users: seedUsers,
    sessionUserId: null,
    rememberMe: false,
    posts: seedPosts,
    news: seedNews,
    media: [],
    audio: [],
    messages: [],
    chatAgreements: [],
    devices: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return createInitialState();

    // Мягкая миграция старых версий состояния и удаление ботов.
    const savedUsers = Array.isArray(saved.users) ? saved.users : seedUsers;
    const users = savedUsers.filter((user) => !REMOVED_USER_IDS.has(user.id));
    const userIds = new Set(users.map((user) => user.id));

    const savedPosts = Array.isArray(saved.posts) ? saved.posts : seedPosts;
    const posts = savedPosts.filter((post) => userIds.has(post.authorId));
    const news = Array.isArray(saved.news) ? saved.news : seedNews;

    const media = (Array.isArray(saved.media) ? saved.media : [])
      // Временные ссылки на большие файлы не переживают перезагрузку.
      .filter((item) => !item.src?.startsWith('blob:'))
      .filter((item) => !item.authorId || userIds.has(item.authorId));

    const audio = (Array.isArray(saved.audio) ? saved.audio : [])
      .filter((item) => !item.src?.startsWith('blob:'))
      .filter((item) => !item.authorId || userIds.has(item.authorId));

    const messages = (Array.isArray(saved.messages) ? saved.messages : [])
      .filter((message) => userIds.has(message.fromId) && userIds.has(message.toId));

    const chatAgreements = (Array.isArray(saved.chatAgreements) ? saved.chatAgreements : [])
      .filter((userId) => userIds.has(userId));

    const devices = (Array.isArray(saved.devices) ? saved.devices : [])
      .filter((device) => userIds.has(device.userId));

    const sessionUserId = saved.rememberMe === true && userIds.has(saved.sessionUserId)
      ? saved.sessionUserId
      : null;

    const cleaned = {
      users,
      rememberMe: saved.rememberMe === true,
      sessionUserId,
      posts,
      news,
      media,
      audio,
      messages,
      chatAgreements,
      devices,
    };

    // Сразу фиксируем очищенное состояние, чтобы боты не вернулись.
    saveState(cleaned);
    return cleaned;
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Приватный режим или переполненное хранилище, работаем без сохранения.
  }
}
