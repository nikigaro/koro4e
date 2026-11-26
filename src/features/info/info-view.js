import { escapeHtml } from '../../shared/utils/escape-html.js';
import { INFO_PAGES } from './info-pages.js';

function renderItems(items) {
  return `<ul class="info-page__list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/** Простая страница с текстом по ключу из info-pages.js. */
export function createInfoView({ page }) {
  const data = INFO_PAGES[page];

  const sectionsHtml = data.sections
    ? data.sections.map((section) => `
        <section class="info-page__section">
          <h2 class="info-page__section-title">${escapeHtml(section.title)}</h2>
          ${renderItems(section.items)}
        </section>
      `).join('')
    : renderItems(data.items);

  const noteHtml = data.note
    ? `<div class="info-page__note">
        <strong>${escapeHtml(data.noteTitle ?? 'Помните')}</strong>
        <p>${escapeHtml(data.note)}</p>
      </div>`
    : '';

  const html = `
    <section class="info-page">
      <h1 class="info-page__title">${escapeHtml(data.title)}</h1>
      <p class="info-page__intro">${escapeHtml(data.intro)}</p>
      ${sectionsHtml}
      ${noteHtml}
    </section>
  `;

  function mount() {
    return () => {};
  }

  return { html, mount };
}
