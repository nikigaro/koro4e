import { escapeHtml } from '../shared/utils/escape-html.js';

/** Маленький счётчик онлайна в шапке со списком активных аккаунтов. */
export function createOnlineCounter({ store, usersService, presenceService }) {
  const html = `
    <div class="online-counter" data-online-counter tabindex="0">
      <span class="online-counter__dot" aria-hidden="true"></span>
      <span data-online-count>0/0</span>
      <div class="online-counter__popover" data-online-list></div>
    </div>
  `;

  function mount(root) {
    const wrapper = root.querySelector('[data-online-counter]');
    const counter = wrapper.querySelector('[data-online-count]');
    const list = wrapper.querySelector('[data-online-list]');

    function render() {
      const users = usersService.listUsers();
      const online = users.filter((user) => presenceService.isOnline(user.id));
      counter.textContent = `${online.length}/${users.length}`;

      list.innerHTML = online.length
        ? online.map((user) => `
          <div class="online-counter__user">
            <span class="online-counter__dot" aria-hidden="true"></span>
            <span>@${escapeHtml(user.handle)}</span>
          </div>
        `).join('')
        : '<div class="online-counter__empty">Никого нет онлайн</div>';
    }

    render();
    const unsubscribe = store.subscribe(render);
    return () => unsubscribe();
  }

  return { html, mount };
}
