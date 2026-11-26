import { escapeHtml } from '../../shared/utils/escape-html.js';

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('ru-RU');
}

function renderDevice(device) {
  const status = device.primary
    ? '<span class="device__badge">Основное</span>'
    : device.approved
      ? '<span class="device__status">Подтверждено</span>'
      : '<span class="device__status device__status--pending">Ожидает подтверждения</span>';

  const action = device.primary
    ? ''
    : device.approved
      ? `<button class="action" type="button" data-device-revoke="${escapeHtml(device.id)}">Отозвать</button>`
      : `<button class="button button--primary" type="button" data-device-approve="${escapeHtml(device.id)}">Подтвердить</button>`;

  return `
    <div class="device">
      <div class="device__info">
        <strong>${escapeHtml(device.name)}</strong>
        <span>${formatDate(device.createdAt)}</span>
        ${status}
      </div>
      ${action}
    </div>
  `;
}

/** Список устройств аккаунта в профиле. */
export function createDevicesView({ store, usersService, devicesService }) {
  const user = usersService.getCurrentUser();
  let container = null;

  const html = `
    <section class="devices">
      <h2 class="devices__title">Мои устройства</h2>
      <div class="devices__list" data-devices-list></div>
    </section>
  `;

  function render() {
    if (!container) return;
    const devices = devicesService.listForUser(user.id);
    container.innerHTML = devices.length
      ? devices.map(renderDevice).join('')
      : '<div class="empty">Устройств пока нет.</div>';
  }

  function mount(root) {
    container = root.querySelector('[data-devices-list]');

    function handleClick(event) {
      const approve = event.target.closest('[data-device-approve]');
      const revoke = event.target.closest('[data-device-revoke]');
      if (approve) devicesService.approve(approve.dataset.deviceApprove);
      if (revoke) devicesService.revoke(revoke.dataset.deviceRevoke);
    }

    container.addEventListener('click', handleClick);
    const unsubscribe = store.subscribe(render);
    render();

    return () => {
      unsubscribe();
      container.removeEventListener('click', handleClick);
      container = null;
    };
  }

  return { html, mount };
}
