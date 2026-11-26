import { getTheme, toggleTheme } from '../shared/theme.js';

/** Кнопка переключения светлой и тёмной темы. */
export function createThemeToggle() {
  const html = `
    <button class="theme-toggle" type="button" data-theme-toggle title="Переключить тему">
      <span class="theme-toggle__icon" aria-hidden="true"></span>
    </button>
  `;

  function mount(root) {
    const button = root.querySelector('[data-theme-toggle]');

    function sync() {
      button.dataset.theme = getTheme();
      button.setAttribute('aria-label', getTheme() === 'dark'
        ? 'Включить светлую тему'
        : 'Включить тёмную тему');
    }

    function handleClick() {
      toggleTheme();
      sync();
    }

    button.addEventListener('click', handleClick);
    sync();

    return () => button.removeEventListener('click', handleClick);
  }

  return { html, mount };
}
