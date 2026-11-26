import { MAX_POST_LENGTH } from './posts-service.js';
import { escapeHtml } from '../../shared/utils/escape-html.js';
import { renderIcon } from '../../shared/ui/icon.js';
import { createDrawingPad } from '../../shared/ui/drawing-pad.js';
import {
  readImageFile,
  createLinkAttachment,
  createDrawingAttachment,
  renderAttachmentPreview,
} from './attachments.js';

/** Форма публикации с вложениями: фото, ссылка и рисунок. */
export function createPostComposer({ postsService, wallOwnerId = null, placeholder = 'Короче, что у вас нового?' }) {
  let attachments = [];
  let nodes = null;

  const drawingPad = createDrawingPad({
    id: 'post',
    title: 'Нарисовать рисунок',
    width: 600,
    height: 400,
    onSave: (dataUrl) => {
      attachments.push(createDrawingAttachment(dataUrl));
      renderAttachments();
    },
  });

  const html = `
    <form class="composer" data-post-composer novalidate>
      <label class="sr-only" for="post-text">Текст нового поста</label>
      <textarea
        id="post-text"
        class="composer__input"
        name="text"
        rows="3"
        maxlength="${MAX_POST_LENGTH}"
        placeholder="${escapeHtml(placeholder)}"
      ></textarea>

      <div class="composer__attachments" data-attachments></div>

      <div class="composer__link-row" data-link-row hidden>
        <input class="field__input" type="url" placeholder="https://..." data-link-input />
        <button class="button" type="button" data-link-add>Добавить</button>
      </div>

      <div class="composer__tools">
        <button class="composer__tool" type="button" data-add-photo title="Прикрепить фото" aria-label="Прикрепить фото">${renderIcon('photo')}</button>
        <button class="composer__tool" type="button" data-add-link title="Добавить ссылку" aria-label="Добавить ссылку">${renderIcon('link')}</button>
        <button class="composer__tool" type="button" data-add-draw title="Нарисовать рисунок" aria-label="Нарисовать рисунок">${renderIcon('draw')}</button>
        <input type="file" accept="image/*" hidden data-photo-input />
      </div>

      <div class="composer__footer">
        <span class="composer__counter" data-post-counter>0/${MAX_POST_LENGTH}</span>
        <button class="button button--primary" type="submit" data-post-submit disabled>Опубликовать</button>
      </div>
    </form>
    ${drawingPad.html}
  `;

  function sync() {
    if (!nodes) return;
    const length = nodes.input.value.trim().length;
    nodes.counter.textContent = `${length}/${MAX_POST_LENGTH}`;
    nodes.counter.classList.toggle('is-near-limit', length > MAX_POST_LENGTH - 20);
    nodes.submit.disabled = length === 0 && attachments.length === 0;
  }

  function renderAttachments() {
    if (!nodes) return;
    nodes.attachments.innerHTML = attachments.map(renderAttachmentPreview).join('');
    sync();
  }

  function mount(root) {
    const drawingControls = drawingPad.mount(root);
    const form = root.querySelector('[data-post-composer]');
    nodes = {
      form,
      input: form.querySelector('textarea'),
      counter: form.querySelector('[data-post-counter]'),
      submit: form.querySelector('[data-post-submit]'),
      attachments: form.querySelector('[data-attachments]'),
      linkRow: form.querySelector('[data-link-row]'),
      linkInput: form.querySelector('[data-link-input]'),
      photoInput: form.querySelector('[data-photo-input]'),
    };

    function addLink() {
      const attachment = createLinkAttachment(nodes.linkInput.value);
      if (!attachment) {
        nodes.linkInput.focus();
        return;
      }
      attachments.push(attachment);
      nodes.linkInput.value = '';
      nodes.linkRow.hidden = true;
      renderAttachments();
    }

    function handleClick(event) {
      if (event.target.closest('[data-add-photo]')) nodes.photoInput.click();
      if (event.target.closest('[data-add-link]')) {
        nodes.linkRow.hidden = false;
        nodes.linkInput.focus();
      }
      if (event.target.closest('[data-add-draw]')) drawingControls.open();
      if (event.target.closest('[data-link-add]')) addLink();

      const remove = event.target.closest('[data-remove-attachment]');
      if (remove) {
        attachments.splice(Number(remove.dataset.removeAttachment), 1);
        renderAttachments();
      }
    }

    async function handlePhotoChange(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        attachments.push(await readImageFile(file));
        renderAttachments();
      } catch {
        // Файл не прочитан, оставляем форму как есть.
      }
      nodes.photoInput.value = '';
    }

    function handleLinkKey(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        addLink();
      }
    }

    function handleInput() {
      sync();
    }

    function handleSubmit(event) {
      event.preventDefault();
      const post = postsService.add(nodes.input.value, attachments, wallOwnerId);
      if (!post) return;

      nodes.input.value = '';
      attachments = [];
      renderAttachments();
      nodes.input.focus();
    }

    nodes.input.addEventListener('input', handleInput);
    nodes.linkInput.addEventListener('keydown', handleLinkKey);
    nodes.photoInput.addEventListener('change', handlePhotoChange);
    form.addEventListener('click', handleClick);
    form.addEventListener('submit', handleSubmit);
    renderAttachments();

    return () => {
      nodes.input.removeEventListener('input', handleInput);
      nodes.linkInput.removeEventListener('keydown', handleLinkKey);
      nodes.photoInput.removeEventListener('change', handlePhotoChange);
      form.removeEventListener('click', handleClick);
      form.removeEventListener('submit', handleSubmit);
      drawingControls.destroy();
      nodes = null;
    };
  }

  return { html, mount };
}
