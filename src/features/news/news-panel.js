import { escapeHtml } from '../../shared/utils/escape-html.js';

const NEWS = [
  { title: 'Добро пожаловать', text: 'Короче это место для коротких мыслей.' },
  { title: 'Новые разделы', text: 'Музыка и медиа уже в нижнем меню.' },
  { title: 'Свой стиль', text: 'Нарисуй аватар и баннер в профиле.' },
  { title: 'Хайпуй', text: 'Отмечай посты значком XD.' },
];

/** Боковая панель с новостями слева от ленты. */
export function createNewsPanel() {
  const html = `
    <aside class="news-panel">
      <h2 class="news-panel__title">Новости</h2>
      <ul class="news-panel__list">
        ${NEWS.map((item) => `
          <li class="news-panel__item">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.text)}</span>
          </li>
        `).join('')}
      </ul>
    </aside>
  `;

  function mount() {
    return () => {};
  }

  return { html, mount };
}
