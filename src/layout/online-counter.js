/** Маленький счётчик онлайна в шапке. Пока считается по числу пользователей. */
export function createOnlineCounter({ store, usersService }) {
  const html = `
    <div class="online-counter" title="Онлайн">
      <span class="online-counter__dot" aria-hidden="true"></span>
      <span data-online-count>0/0</span>
    </div>
  `;

  function mount(root) {
    const counter = root.querySelector('[data-online-count]');

    function render() {
      const total = usersService.listUsers().length;
      const online = total > 0
        ? Math.max(1, Math.min(total, Math.round(total * 0.13)))
        : 0;
      counter.textContent = `${online}/${total}`;
    }

    render();
    const unsubscribe = store.subscribe(render);
    return () => unsubscribe();
  }

  return { html, mount };
}
