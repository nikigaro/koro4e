import { createSnowfall } from '../shared/ui/snowfall.js';

const STORAGE_KEY = 'koroche.snow';

function isSnowEnabled() {
  return localStorage.getItem(STORAGE_KEY) === 'on';
}

/** Кнопка-снежинка рядом с темой: включает и выключает снегопад. */
export function createSnowToggle() {
  const html = `
    <button
      class="snow-toggle"
      type="button"
      data-snow-toggle
      aria-pressed="false"
      title="Включить снег"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17" />
        <path d="m9 4 3 3 3-3M9 20l3-3 3 3M4.5 9.5 7.5 11l-3 1M19.5 9.5 16.5 11l3 1M4.5 14.5 7.5 13l-3-1M19.5 14.5 16.5 13l3-1" />
      </svg>
    </button>
  `;

  function mount(root) {
    const button = root.querySelector('[data-snow-toggle]');
    const snowfall = createSnowfall();
    let enabled = isSnowEnabled();

    function sync() {
      button.classList.toggle('is-active', enabled);
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? 'Выключить снег' : 'Включить снег');
      button.title = enabled ? 'Выключить снег' : 'Включить снег';
    }

    function handleClick() {
      enabled = !enabled;
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
      if (enabled) snowfall.start();
      else snowfall.stop();
      sync();
    }

    button.addEventListener('click', handleClick);
    if (enabled) snowfall.start();
    sync();

    return () => {
      button.removeEventListener('click', handleClick);
      snowfall.destroy();
    };
  }

  return { html, mount };
}
