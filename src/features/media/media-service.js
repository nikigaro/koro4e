import { createId } from '../../shared/utils/create-id.js';
import { readImageFile } from '../../shared/utils/read-image-file.js';
import { readMediaFile, createVideoThumbnail } from '../../shared/utils/read-media-file.js';

/** Загрузка фото и видео в раздел «Медиа». */
export function createMediaService({ store, usersService }) {
  function list() {
    return store.getState().media ?? [];
  }

  async function add({ file, name, cover }) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return null;

    const authorId = usersService.getCurrentUser()?.id ?? null;
    let item;

    if (isImage) {
      const image = await readImageFile(file);
      item = {
        id: createId('media'),
        type: 'image',
        src: image.src,
        thumbnail: cover ?? image.src,
        name: name || file.name,
        authorId,
        persistent: true,
        likes: 0,
        likedByMe: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      const result = await readMediaFile(file);
      const thumbnail = cover ?? await createVideoThumbnail(file);
      item = {
        id: createId('media'),
        type: 'video',
        src: result.src,
        thumbnail,
        name: name || file.name,
        authorId,
        persistent: result.persistent,
        likes: 0,
        likedByMe: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    store.setState((state) => ({ ...state, media: [item, ...(state.media ?? [])] }));
    return item;
  }

  function toggleLike(id) {
    store.setState((state) => ({
      ...state,
      media: (state.media ?? []).map((item) => item.id === id
        ? {
          ...item,
          likedByMe: !item.likedByMe,
          likes: (item.likes ?? 0) + (item.likedByMe ? -1 : 1),
          updatedAt: Date.now(),
        }
        : item),
    }));
  }

  function remove(id) {
    store.setState((state) => ({
      ...state,
      media: (state.media ?? []).filter((item) => item.id !== id),
      deletedIds: [...new Set([...(state.deletedIds ?? []), id])].slice(-1000),
    }));
  }

  return { list, add, toggleLike, remove };
}
