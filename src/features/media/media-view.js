import { escapeHtml } from '../../shared/utils/escape-html.js';
import { createUploadDialog } from '../../shared/ui/upload-dialog.js';

function renderCard(item) {
  const preview = item.thumbnail
    ? `<img src="${escapeHtml(item.thumbnail)}" alt="" />`
    : `<span class="media-card__placeholder">${item.type === 'video' ? 'Видео' : 'Фото'}</span>`;
  const likes = item.likes ?? 0;

  return `
    <article class="media-card" data-open-media="${escapeHtml(item.id)}">
      <div class="media-card__preview">
        ${preview}
        ${item.type === 'video' ? '<span class="media-card__play">▶</span>' : ''}
      </div>
      <div class="media-card__footer">
        <span class="media-card__name">${escapeHtml(item.name)}</span>
        <button class="card-like ${item.likedByMe ? 'is-liked' : ''}" type="button" data-like-media="${escapeHtml(item.id)}" aria-label="ХАЙП" title="ХАЙП">
          <img class="card-like__icon" src="assets/icons/xd-hype.png" alt="" aria-hidden="true" />
          ${likes}
        </button>
        <button class="media-card__remove" type="button" data-remove-media="${escapeHtml(item.id)}" aria-label="Удалить">×</button>
      </div>
    </article>
  `;
}

/** Раздел «Медиа» с загрузкой фото и видео. */
export function createMediaView({ store, mediaService }) {
  let pendingFiles = [];

  const uploadDialog = createUploadDialog({
    id: 'media',
    title: 'Загрузить в медиа',
    onSubmit: (data) => {
      mediaService.add(data).finally(() => setTimeout(showNext, 0));
    },
  });

  function showNext() {
    const next = pendingFiles.shift();
    if (!next || !uploadControls) return;
    uploadControls.open(next.file, next.file.name, {
      type: next.type,
      title: next.type === 'video' ? 'Загрузить видео' : 'Загрузить картинку',
      nameLabel: next.type === 'video' ? 'Название видео' : 'Название картинки',
    });
  }

  let uploadControls = null;

  const html = `
    <section class="upload-page">
      <header class="upload-page__header">
        <div>
          <h1 class="info-page__title">Медиа</h1>
          <p class="info-page__intro">Фото и видео, как на ютубе. Загружай и смотри здесь.</p>
        </div>
        <div class="upload-page__actions">
          <label class="button button--primary">
            Картинка
            <input type="file" accept="image/*" multiple hidden data-image-input />
          </label>
          <label class="button">
            Видео
            <input type="file" accept="video/*" multiple hidden data-video-input />
          </label>
        </div>
      </header>
      <div class="media-grid" data-media-grid></div>
      <div class="media-viewer" data-media-viewer hidden>
        <button class="media-viewer__close" type="button" data-close-viewer aria-label="Закрыть">×</button>
        <div class="media-viewer__content" data-viewer-content></div>
      </div>
      ${uploadDialog.html}
    </section>
  `;

  function mount(root) {
    uploadControls = uploadDialog.mount(root);
    const grid = root.querySelector('[data-media-grid]');
    const imageInput = root.querySelector('[data-image-input]');
    const videoInput = root.querySelector('[data-video-input]');
    const viewer = root.querySelector('[data-media-viewer]');
    const viewerContent = viewer.querySelector('[data-viewer-content]');

    function render() {
      const items = mediaService.list();
      grid.innerHTML = items.length
        ? items.map(renderCard).join('')
        : '<div class="empty">Пока нет фото и видео. Загрузи первое.</div>';
    }

    function openViewer(id) {
      const item = mediaService.list().find((media) => media.id === id);
      if (!item) return;

      viewerContent.innerHTML = item.type === 'video'
        ? `<video src="${escapeHtml(item.src)}" controls autoplay></video>`
        : `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" />`;
      viewer.hidden = false;
    }

    function handleClick(event) {
      const like = event.target.closest('[data-like-media]');
      if (like) {
        mediaService.toggleLike(like.dataset.likeMedia);
        return;
      }
      const remove = event.target.closest('[data-remove-media]');
      if (remove) {
        mediaService.remove(remove.dataset.removeMedia);
        return;
      }
      const card = event.target.closest('[data-open-media]');
      if (card) openViewer(card.dataset.openMedia);
      if (event.target.closest('[data-close-viewer]')) viewer.hidden = true;
    }

    function handleFiles(event, type) {
      pendingFiles = Array.from(event.target.files ?? []).map((file) => ({ file, type }));
      event.target.value = '';
      showNext();
    }

    function handleImages(event) {
      handleFiles(event, 'image');
    }

    function handleVideos(event) {
      handleFiles(event, 'video');
    }

    function handleKey(event) {
      if (event.key === 'Escape' && !viewer.hidden) viewer.hidden = true;
    }

    render();
    root.addEventListener('click', handleClick);
    imageInput.addEventListener('change', handleImages);
    videoInput.addEventListener('change', handleVideos);
    document.addEventListener('keydown', handleKey);
    const unsubscribe = store.subscribe(render);

    return () => {
      unsubscribe();
      root.removeEventListener('click', handleClick);
      imageInput.removeEventListener('change', handleImages);
      videoInput.removeEventListener('change', handleVideos);
      document.removeEventListener('keydown', handleKey);
      uploadControls.destroy();
      uploadControls = null;
    };
  }

  return { html, mount };
}
