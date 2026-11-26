import { escapeHtml } from '../shared/utils/escape-html.js';

const ICONS = {
  feed: '<path d="M4 6h16M4 12h16M4 18h10" />',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5A8 8 0 1 1 21 12Z" /><path d="M8 11h8M8 15h5" />',
  profile: '<circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c0-3.8 3.4-5.5 7.5-5.5s7.5 1.7 7.5 5.5" />',
  wall: '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" />',
  rules: '<path d="M9 6h11M9 12h11M9 18h7" /><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />',
  media: '<rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-5 4 4 3-3 4 4" />',
  ideas: '<path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.8 1 1.5 1 2.5h6c0-1 .3-1.7 1-2.5A6 6 0 0 0 12 3Z" />',
  music: '<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />',
  admin: '<path d="M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />',
};

function renderIcon(name) {
  return `<span class="tab__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ICONS.feed}</svg></span>`;
}

function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/feed';
  return raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
}

/** Панель вкладок в стиле браузера: активная вкладка выделена и «соединена» с контентом. */
export function createTabBar(items) {
  const html = `
    <nav class="tab-bar" role="tablist" aria-label="Разделы">
      ${items.map((item) => `
        <a class="tab" role="tab" href="#${item.path}" data-tab-id="${item.id}" data-tab-path="${escapeHtml(item.path)}" data-tab-group="${item.group ? escapeHtml(item.group) : ''}">
          ${renderIcon(item.icon)}
          <span class="tab__label">${escapeHtml(item.label)}</span>
        </a>
      `).join('')}
    </nav>
  `;

  function mount(root) {
    const bar = root.querySelector('.tab-bar');
    const tabs = Array.from(bar.querySelectorAll('.tab'));

    function syncActive() {
      const path = currentPath();
      tabs.forEach((tab) => {
        const isActive = tab.dataset.tabPath === path
          || Boolean(tab.dataset.tabGroup && path.startsWith(tab.dataset.tabGroup));
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
    }

    function handleClick(event) {
      // Повторный клик по активной вкладке просто обновляет выделение.
      if (event.target.closest('.tab')) syncActive();
    }

    bar.addEventListener('click', handleClick);
    window.addEventListener('hashchange', syncActive);
    syncActive();

    return () => {
      bar.removeEventListener('click', handleClick);
      window.removeEventListener('hashchange', syncActive);
    };
  }

  return { html, mount };
}
