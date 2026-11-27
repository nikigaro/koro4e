import { escapeHtml } from '../../shared/utils/escape-html.js';

function renderUser(user, banService, meId) {
  const banned = banService.isUserBanned(user.id);
  const action = user.id === meId
    ? '<span class="admin__you">Это вы</span>'
    : banned
      ? `<button class="button" type="button" data-unban-user="${escapeHtml(user.id)}">Разбанить</button>`
      : `<button class="button button--danger" type="button" data-ban-user="${escapeHtml(user.id)}">Забанить</button>`;

  return `
    <div class="admin-row">
      <div class="admin-row__info">
        <strong>@${escapeHtml(user.handle)}</strong>
        <span>${banned ? 'Заблокирован' : 'Активен'}</span>
      </div>
      ${action}
    </div>
  `;
}

function renderDevice(device, banService, myDeviceId, users) {
  const banned = banService.isDeviceBanned(device.id);
  const owner = users.find((user) => user.id === device.userId);
  const action = device.id === myDeviceId
    ? '<span class="admin__you">Ваше устройство</span>'
    : banned
      ? `<button class="button" type="button" data-unban-device="${escapeHtml(device.id)}">Разбанить</button>`
      : `<button class="button button--danger" type="button" data-ban-device="${escapeHtml(device.id)}">Забанить</button>`;

  return `
    <div class="admin-row">
      <div class="admin-row__info">
        <strong>${escapeHtml(device.name)}</strong>
        <span>@${escapeHtml(owner?.handle ?? 'неизвестно')} · ${banned ? 'Заблокировано' : 'Активно'}</span>
      </div>
      ${action}
    </div>
  `;
}

/** Панель создателя: блокировка аккаунтов и устройств. */
export function createAdminView({ store, usersService, devicesService, banService }) {
  const me = usersService.getCurrentUser();
  const html = `
    <section class="admin-page">
      <h1 class="info-page__title">Админ панель</h1>
      <p class="info-page__intro">Только создатель может банить аккаунты и устройства.</p>

      <h2 class="admin__title">Аккаунты</h2>
      <div class="admin__list" data-admin-users></div>

      <h2 class="admin__title">Устройства</h2>
      <p class="admin__hint">Устройство это аналог IP в этом приложении: реальный адрес браузер не знает.</p>
      <div class="admin__list" data-admin-devices></div>
    </section>
  `;

  function mount(root) {
    const usersNode = root.querySelector('[data-admin-users]');
    const devicesNode = root.querySelector('[data-admin-devices]');

    function render() {
      const users = usersService.listUsers();
      usersNode.innerHTML = users
        .map((user) => renderUser(user, banService, me.id))
        .join('');

      devicesNode.innerHTML = (store.getState().devices ?? []).length
        ? (store.getState().devices ?? [])
          .map((device) => renderDevice(device, banService, devicesService.getDeviceId(), users))
          .join('')
        : '<div class="empty">Устройств пока нет.</div>';
    }

    function handleClick(event) {
      const banUser = event.target.closest('[data-ban-user]');
      const unbanUser = event.target.closest('[data-unban-user]');
      const banDevice = event.target.closest('[data-ban-device]');
      const unbanDevice = event.target.closest('[data-unban-device]');

      if (banUser && window.confirm('Забанить аккаунт? Все его данные будут удалены.')) {
        banService.banUser(banUser.dataset.banUser);
      }
      if (unbanUser) banService.unbanUser(unbanUser.dataset.unbanUser);
      if (banDevice && window.confirm('Забанить устройство?')) {
        banService.banDevice(banDevice.dataset.banDevice);
      }
      if (unbanDevice) banService.unbanDevice(unbanDevice.dataset.unbanDevice);
    }

    render();
    root.addEventListener('click', handleClick);
    const unsubscribe = store.subscribe(render);

    return () => {
      unsubscribe();
      root.removeEventListener('click', handleClick);
    };
  }

  return { html, mount };
}
