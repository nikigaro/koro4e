import { escapeHtml } from '../../shared/utils/escape-html.js';
import { readImageFile } from '../../shared/utils/read-image-file.js';

function renderItem(item, canEdit) {
  return `
    <li class="news-panel__item" data-news-item="${escapeHtml(item.id)}">
      <div class="news-panel__item-head">
        <strong>${escapeHtml(item.title)}</strong>
        ${item.version ? `<span class="news-panel__version">v${escapeHtml(item.version)}</span>` : ''}
      </div>
      <span>${escapeHtml(item.text)}</span>
      ${item.link ? `<a class="news-panel__link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Ссылка</a>` : ''}
      ${item.image ? `<img class="news-panel__image" src="${escapeHtml(item.image)}" alt="" />` : ''}
      ${canEdit ? `
        <div class="news-panel__item-actions">
          <button class="action" type="button" data-news-edit="${escapeHtml(item.id)}">Изменить</button>
          <button class="action" type="button" data-news-delete="${escapeHtml(item.id)}">Удалить</button>
        </div>
      ` : ''}
    </li>
  `;
}

/** Боковая панель с новостями. Создатель может править список. */
export function createNewsPanel({ store, newsService }) {
  const canEdit = newsService.canEdit();

  const html = `
    <aside class="news-panel" data-news-panel>
      <div class="news-panel__head">
        <h2 class="news-panel__title">Новости</h2>
        ${canEdit ? '<button class="action" type="button" data-news-add>Добавить</button>' : ''}
      </div>
      <ul class="news-panel__list" data-news-list></ul>
      ${canEdit ? `
        <form class="news-editor" data-news-form hidden>
          <label class="field">
            <span class="field__label">Название</span>
            <input class="field__input" type="text" data-news-title maxlength="${newsService.MAX_TITLE}" required />
          </label>
          <label class="field">
            <span class="field__label">Версия</span>
            <input class="field__input" type="text" data-news-version maxlength="${newsService.MAX_VERSION}" placeholder="0.3.1" />
          </label>
          <label class="field">
            <span class="field__label">Содержимое</span>
            <textarea class="field__input" data-news-text rows="3" maxlength="${newsService.MAX_TEXT}" required></textarea>
          </label>
          <label class="field">
            <span class="field__label">Ссылка</span>
            <input class="field__input" type="url" data-news-link placeholder="https://..." />
          </label>
          <div class="news-editor__image">
            <span class="field__label">Картинка</span>
            <div class="news-editor__preview" data-news-preview>Нет картинки</div>
            <input type="file" accept="image/*" hidden data-news-image />
            <button class="button" type="button" data-news-pick>Выбрать картинку</button>
          </div>
          <div class="news-editor__actions">
            <button class="button" type="button" data-news-cancel>Отмена</button>
            <button class="button button--primary" type="submit">Сохранить</button>
          </div>
        </form>
      ` : ''}
    </aside>
  `;

  function mount(root) {
    const panel = root.querySelector('[data-news-panel]');
    const list = panel.querySelector('[data-news-list]');
    const form = panel.querySelector('[data-news-form]');
    const titleInput = panel.querySelector('[data-news-title]');
    const versionInput = panel.querySelector('[data-news-version]');
    const textInput = panel.querySelector('[data-news-text]');
    const linkInput = panel.querySelector('[data-news-link]');
    const imageInput = panel.querySelector('[data-news-image]');
    const preview = panel.querySelector('[data-news-preview]');
    let editingId = null;
    let imageSrc = '';

    function showPreview() {
      preview.innerHTML = imageSrc
        ? `<img src="${escapeHtml(imageSrc)}" alt="" />`
        : 'Нет картинки';
    }

    function closeForm() {
      editingId = null;
      imageSrc = '';
      form.hidden = true;
      titleInput.value = '';
      versionInput.value = '';
      textInput.value = '';
      linkInput.value = '';
      imageInput.value = '';
      showPreview();
    }

    function openForm(item = null) {
      editingId = item?.id ?? null;
      titleInput.value = item?.title ?? '';
      versionInput.value = item?.version ?? '';
      textInput.value = item?.text ?? '';
      linkInput.value = item?.link ?? '';
      imageSrc = item?.image ?? '';
      form.hidden = false;
      showPreview();
      titleInput.focus();
    }

    function render() {
      const items = newsService.list();
      list.innerHTML = items.length
        ? items.map((item) => renderItem(item, canEdit)).join('')
        : '<li class="news-panel__empty">Новостей пока нет.</li>';
    }

    function handleClick(event) {
      const add = event.target.closest('[data-news-add]');
      const edit = event.target.closest('[data-news-edit]');
      const remove = event.target.closest('[data-news-delete]');
      const cancel = event.target.closest('[data-news-cancel]');
      const pick = event.target.closest('[data-news-pick]');

      if (add) openForm();
      if (cancel) closeForm();
      if (pick) imageInput.click();
      if (edit) {
        const item = newsService.list().find((news) => news.id === edit.dataset.newsEdit);
        if (item) openForm(item);
      }
      if (remove && window.confirm('Удалить новость?')) {
        newsService.remove(remove.dataset.newsDelete);
      }
    }

    async function handleImage(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const image = await readImageFile(file);
        imageSrc = image.src;
        showPreview();
      } catch {
        // Картинку не удалось прочитать, оставляем прежнюю.
      }
      imageInput.value = '';
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (newsService.save({
        id: editingId,
        title: titleInput.value,
        version: versionInput.value,
        text: textInput.value,
        link: linkInput.value,
        image: imageSrc,
      })) {
        closeForm();
      }
    }

    render();
    panel.addEventListener('click', handleClick);
    imageInput.addEventListener('change', handleImage);
    if (form) form.addEventListener('submit', handleSubmit);
    const unsubscribe = store.subscribe(render);

    return () => {
      unsubscribe();
      panel.removeEventListener('click', handleClick);
      imageInput.removeEventListener('change', handleImage);
      if (form) form.removeEventListener('submit', handleSubmit);
    };
  }

  return { html, mount };
}
