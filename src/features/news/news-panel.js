import { escapeHtml } from '../../shared/utils/escape-html.js';

function renderItem(item, canEdit) {
  return `
    <li class="news-panel__item" data-news-item="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.text)}</span>
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
            <span class="field__label">Заголовок</span>
            <input class="field__input" type="text" data-news-title maxlength="${newsService.MAX_TITLE}" required />
          </label>
          <label class="field">
            <span class="field__label">Текст</span>
            <textarea class="field__input" data-news-text rows="3" maxlength="${newsService.MAX_TEXT}" required></textarea>
          </label>
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
    const textInput = panel.querySelector('[data-news-text]');
    let editingId = null;

    function closeForm() {
      editingId = null;
      form.hidden = true;
      titleInput.value = '';
      textInput.value = '';
    }

    function openForm(item = null) {
      editingId = item?.id ?? null;
      titleInput.value = item?.title ?? '';
      textInput.value = item?.text ?? '';
      form.hidden = false;
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

      if (add) openForm();
      if (cancel) closeForm();
      if (edit) {
        const item = newsService.list().find((news) => news.id === edit.dataset.newsEdit);
        if (item) openForm(item);
      }
      if (remove && window.confirm('Удалить новость?')) {
        newsService.remove(remove.dataset.newsDelete);
      }
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (newsService.save({
        id: editingId,
        title: titleInput.value,
        text: textInput.value,
      })) {
        closeForm();
      }
    }

    render();
    panel.addEventListener('click', handleClick);
    if (form) form.addEventListener('submit', handleSubmit);
    const unsubscribe = store.subscribe(render);

    return () => {
      unsubscribe();
      panel.removeEventListener('click', handleClick);
      if (form) form.removeEventListener('submit', handleSubmit);
    };
  }

  return { html, mount };
}
