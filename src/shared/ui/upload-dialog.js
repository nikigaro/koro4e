import { escapeHtml } from '../utils/escape-html.js';
import { readImageFile } from '../utils/read-image-file.js';

/** Окно загрузки: подстраивается под тип файла, позволяет сменить название и превью. */
export function createUploadDialog({ id, title, onSubmit }) {
  const html = `
    <div class="upload-dialog" data-upload-dialog="${id}" hidden>
      <div class="upload-dialog__card">
        <header class="upload-dialog__header">
          <h2 data-dialog-title>${escapeHtml(title)}</h2>
          <button class="action" type="button" data-close aria-label="Закрыть">×</button>
        </header>
        <div class="upload-dialog__preview" data-file-preview></div>
        <p class="upload-dialog__file" data-file-name></p>
        <label class="field">
          <span class="field__label" data-name-label>Название</span>
          <input class="field__input" type="text" data-name />
        </label>
        <div class="upload-dialog__cover" data-cover-block>
          <span class="field__label">Превью</span>
          <div class="upload-dialog__cover-preview" data-cover-preview>Нет картинки</div>
          <input type="file" accept="image/*" hidden data-cover-input />
          <button class="button" type="button" data-pick-cover>Выбрать картинку</button>
        </div>
        <footer class="upload-dialog__footer">
          <button class="button" type="button" data-cancel>Отмена</button>
          <button class="button button--primary" type="button" data-save>Загрузить</button>
        </footer>
      </div>
    </div>
  `;

  function mount(root) {
    const modal = root.querySelector(`[data-upload-dialog="${id}"]`);
    const heading = modal.querySelector('[data-dialog-title]');
    const nameLabel = modal.querySelector('[data-name-label]');
    const filePreview = modal.querySelector('[data-file-preview]');
    const fileName = modal.querySelector('[data-file-name]');
    const nameInput = modal.querySelector('[data-name]');
    const coverBlock = modal.querySelector('[data-cover-block]');
    const coverPreview = modal.querySelector('[data-cover-preview]');
    const coverInput = modal.querySelector('[data-cover-input]');
    let currentFile = null;
    let coverSrc = null;
    let previewUrl = null;

    function releasePreview() {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      filePreview.replaceChildren();
    }

    function open(file, defaultName, options = {}) {
      releasePreview();
      currentFile = file;
      coverSrc = null;

      heading.textContent = options.title ?? title;
      nameLabel.textContent = options.nameLabel ?? 'Название';
      coverBlock.hidden = options.type === 'image';
      coverPreview.innerHTML = 'Нет картинки';
      coverPreview.classList.remove('has-image');

      nameInput.value = defaultName ?? file?.name ?? '';
      fileName.textContent = file?.name ?? '';

      if (file) {
        previewUrl = URL.createObjectURL(file);
        const tag = options.type === 'video' ? 'video'
          : options.type === 'audio' ? 'audio' : 'img';
        const element = document.createElement(tag);
        element.src = previewUrl;
        if (tag !== 'img') element.controls = true;
        if (tag === 'video') {
          element.muted = true;
          element.playsInline = true;
        }
        filePreview.replaceChildren(element);
      }

      modal.hidden = false;
      nameInput.focus();
    }

    function close() {
      modal.hidden = true;
      currentFile = null;
      releasePreview();
    }

    async function handleCover(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const image = await readImageFile(file);
        coverSrc = image.src;
        coverPreview.innerHTML = `<img src="${escapeHtml(coverSrc)}" alt="" />`;
        coverPreview.classList.add('has-image');
      } catch {
        // Картинку не удалось прочитать, оставляем прежнее превью.
      }
      coverInput.value = '';
    }

    function handleSave() {
      if (!currentFile) return;
      onSubmit({
        file: currentFile,
        name: nameInput.value.trim() || currentFile.name,
        cover: coverSrc,
      });
      close();
    }

    function handleKey(event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    }

    function handlePickCover() {
      coverInput.click();
    }

    modal.querySelector('[data-pick-cover]').addEventListener('click', handlePickCover);
    coverInput.addEventListener('change', handleCover);
    modal.querySelector('[data-close]').addEventListener('click', close);
    modal.querySelector('[data-cancel]').addEventListener('click', close);
    modal.querySelector('[data-save]').addEventListener('click', handleSave);
    document.addEventListener('keydown', handleKey);

    function destroy() {
      modal.querySelector('[data-pick-cover]').removeEventListener('click', handlePickCover);
      coverInput.removeEventListener('change', handleCover);
      modal.querySelector('[data-close]').removeEventListener('click', close);
      modal.querySelector('[data-cancel]').removeEventListener('click', close);
      modal.querySelector('[data-save]').removeEventListener('click', handleSave);
      document.removeEventListener('keydown', handleKey);
      releasePreview();
    }

    return { destroy, open, close };
  }

  return { html, mount };
}
