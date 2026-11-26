import { createId } from '../../shared/utils/create-id.js';
import { isCreator } from '../users/roles.js';

const MAX_TITLE = 60;
const MAX_TEXT = 240;

/** Новости редактирует только создатель. */
export function createNewsService({ store, usersService }) {
  function list() {
    return store.getState().news ?? [];
  }

  function canEdit() {
    return isCreator(usersService.getCurrentUser());
  }

  function save({ id, title, text }) {
    if (!canEdit()) return false;

    const cleanTitle = String(title ?? '').trim().slice(0, MAX_TITLE);
    const cleanText = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!cleanTitle || !cleanText) return false;

    store.setState((state) => {
      const items = state.news ?? [];
      if (id) {
        return {
          ...state,
          news: items.map((item) => (
            item.id === id ? { ...item, title: cleanTitle, text: cleanText } : item
          )),
        };
      }
      return {
        ...state,
        news: [{ id: createId('news'), title: cleanTitle, text: cleanText }, ...items],
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

  return { list, canEdit, save, remove, MAX_TITLE, MAX_TEXT };
}
