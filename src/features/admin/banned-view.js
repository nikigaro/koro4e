/** Экран для заблокированного аккаунта или устройства. */
export function createBannedView({ onLogout }) {
  const html = `
    <section class="banned-page">
      <div class="banned-page__card">
        <h1 class="banned-page__title">Аккаунт заблокирован</h1>
        <p class="banned-page__text">
          Доступ к сайту ограничен создателем. Если это ошибка, напиши администратору.
        </p>
        <button class="button button--primary" type="button" data-banned-logout>Выйти</button>
      </div>
    </section>
  `;

  function mount(root) {
    const button = root.querySelector('[data-banned-logout]');
    function handleClick() {
      onLogout();
    }
    button.addEventListener('click', handleClick);
    return () => button.removeEventListener('click', handleClick);
  }

  return { html, mount };
}
