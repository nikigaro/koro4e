import { createId } from '../../shared/utils/create-id.js';
import { isCreator } from '../users/roles.js';

const MAX_TITLE = 60;
const MAX_VERSION = 20;
const MAX_TEXT = 240;

function cleanLink(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

/** Новости редактирует только создатель. */
export function createNewsService({ store, usersService }) {
  function list() {
    return store.getState().news ?? [];
  }

  function canEdit() {
    return isCreator(usersService.getCurrentUser());
  }

  function save({ id, title, version, text, link, image }) {
    if (!canEdit()) return false;

    const cleanTitle = String(title ?? '').trim().slice(0, MAX_TITLE);
    const cleanVersion = String(version ?? '').trim().slice(0, MAX_VERSION);
    const cleanText = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!cleanTitle || !cleanText) return false;

    const item = {
      title: cleanTitle,
      version: cleanVersion,
      text: cleanText,
      link: cleanLink(link),
      image: typeof image === 'string' && image.startsWith('data:image/') ? image : '',
    };

    store.setState((state) => {
      const items = state.news ?? [];
      if (id) {
        return {
          ...state,
          news: items.map((entry) => (entry.id === id ? { ...entry, ...item } : entry)),
        };
      }
      return {
        ...state,
        news: [{ id: createId('news'), ...item }, ...items],
      };
    });
    return true;
  }

  function remove(id) {
    if (!canEdit()) return false;
    store.setState((state) => ({
      ...state,
      news: (state.news ?? []).filter((item) => item.id !== id),
    }));
    return true;
  }

  return { list, canEdit, save, remove, MAX_TITLE, MAX_VERSION, MAX_TEXT };
}
