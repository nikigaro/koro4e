import { createThemeToggle } from './theme-toggle.js';
import { createSnowToggle } from './snow-toggle.js';
import { createOnlineCounter } from './online-counter.js';

/** Шапка: логотип, тема, снег, счётчик и выход. Вкладки живут отдельно внизу. */
export function createAppHeader({ store, usersService, onLogout }) {
  const themeToggle = createThemeToggle();
  const snowToggle = createSnowToggle();
  const onlineCounter = createOnlineCounter({ store, usersService });

  const html = `
    <header class="app-header">
      <div class="app-header__inner">
        <a class="brand" href="#/feed" aria-label="Короче, на главную">
          <img class="brand__logo" src="./assets/logo.png" alt="Короче" width="72" />
        </a>
        <div class="app-header__actions">
          ${onlineCounter.html}
          ${themeToggle.html}
          ${snowToggle.html}
          <span class="app-header__stat"><strong data-post-count>0</strong> постов</span>
          <button class="action app-header__logout" type="button" data-logout>Выйти</button>
        </div>
      </div>
    </header>
  `;

  function mount(root) {
    const cleanupThemeToggle = themeToggle.mount(root);
    const cleanupSnowToggle = snowToggle.mount(root);
    const cleanupOnlineCounter = onlineCounter.mount(root);
    const counter = root.querySelector('[data-post-count]');
    const logoutButton = root.querySelector('[data-logout]');

    function renderCount() {
      counter.textContent = String(store.getState().posts.length);
    }

    function handleLogout() {
      onLogout();
    }

    renderCount();
    const unsubscribe = store.subscribe(renderCount);
    logoutButton.addEventListener('click', handleLogout);

    return () => {
      cleanupThemeToggle();
      cleanupSnowToggle();
      cleanupOnlineCounter();
      unsubscribe();
      logoutButton.removeEventListener('click', handleLogout);
    };
  }

  return { html, mount };
}
