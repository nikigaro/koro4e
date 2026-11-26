import { createId } from '../../shared/utils/create-id.js';
import { readMediaFile } from '../../shared/utils/read-media-file.js';

/** Загрузка аудио в раздел «Музыка». */
export function createMusicService({ store, usersService }) {
  function list() {
    return store.getState().audio ?? [];
  }

  function parseName(value) {
    const parts = String(value ?? '').split(' - ');
    if (parts.length < 2) return { artist: 'Неизвестный исполнитель', title: value || 'Без названия' };
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  }

  async function add({ file, name, cover }) {
    if (!file.type.startsWith('audio/')) return null;

    const result = await readMediaFile(file);
    const { artist, title } = parseName(name || file.name.replace(/\.[^.]+$/, ''));

    const track = {
      id: createId('track'),
      src: result.src,
      artist,
      title,
      cover: cover ?? null,
      name: name || file.name,
      authorId: usersService.getCurrentUser()?.id ?? null,
      persistent: result.persistent,
      likes: 0,
      likedByMe: false,
      createdAt: Date.now(),
    };

    store.setState((state) => ({ ...state, audio: [track, ...(state.audio ?? [])] }));
    return track;
  }

  function toggleLike(id) {
    store.setState((state) => ({
      ...state,
      audio: (state.audio ?? []).map((track) => track.id === id
        ? {
          ...track,
          likedByMe: !track.likedByMe,
          likes: (track.likes ?? 0) + (track.likedByMe ? -1 : 1),
        }
        : track),
    }));
  }

  function remove(id) {
    store.setState((state) => ({
      ...state,
      audio: (state.audio ?? []).filter((track) => track.id !== id),
    }));
  }

  return { list, add, toggleLike, remove };
}
