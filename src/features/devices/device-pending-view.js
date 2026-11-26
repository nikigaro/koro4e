import { escapeHtml } from '../../shared/utils/escape-html.js';

/** Экран устройства, которое ещё не подтвердили с основного. */
export function createDevicePendingView({ usersService, devicesService, onRetry }) {
  const user = usersService.getCurrentUser();
  const device = devicesService.getCurrentDevice(user.id);
  const name = device?.name ?? 'Это устройство';

  const html = `
    <section class="device-pending">
      <div class="device-pending__card">
        <h1 class="device-pending__title">Доступ к аккаунту</h1>
        <p class="device-pending__banner">Ожидается подтверждение устройства на аккаунте</p>
        <p class="device-pending__device">Устройство: <strong>${escapeHtml(name)}</strong></p>
        <p class="device-pending__hint">
          Подтверди его на основном устройстве в разделе «Профиль → Мои устройства».
        </p>
        <button class="button button--primary" type="button" data-device-retry>
          Проверить снова
        </button>
      </div>
    </section>
  `;

  function mount(root) {
    const button = root.querySelector('[data-device-retry]');
    const interval = window.setInterval(onRetry, 1000);

    function handleClick() {
      onRetry();
    }

    button.addEventListener('click', handleClick);

    return () => {
      window.clearInterval(interval);
      button.removeEventListener('click', handleClick);
    };
  }

  return { html, mount };
}
