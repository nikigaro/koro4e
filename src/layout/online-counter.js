/** Маленький счётчик онлайна в шапке. */
export function createOnlineCounter({ store, usersService, presenceService }) {
  const html = `
    <div class="online-counter" title="Онлайн">
      <span class="online-counter__dot" aria-hidden="true"></span>
      <span data-online-count>0/0</span>
    </div>
  `;

  function mount(root) {
    const counter = root.querySelector('[data-online-count]');

    function render() {
      const users = usersService.listUsers();
      const online = users.filter((user) => presenceService.isOnline(user.id)).length;
      counter.textContent = `${online}/${users.length}`;
    }

    render();
    const unsubscribe = store.subscribe(render);
    return () => unsubscribe();
  }

  return { html, mount };
}
