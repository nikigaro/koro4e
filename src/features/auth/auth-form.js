import { createThemeToggle } from '../../layout/theme-toggle.js';

/** Форма регистрации/входа: переключается режимом 'register' | 'login'. */
export function createAuthForm({ mode, authService, onSuccess }) {
  const isRegister = mode === 'register';
  const themeToggle = createThemeToggle();

  const html = `
    <div class="auth-page__card">
      <div class="auth-form__theme">${themeToggle.html}</div>
      <img class="auth-page__logo" src="./assets/logo.png" alt="Короче" width="96" />
      <h1 class="auth-page__title">${isRegister ? 'Регистрация' : 'Вход'}</h1>
      <p class="auth-page__hint">${isRegister
        ? 'Для регистрации не требуются почта и телефон!'
        : 'Введи юзернейм и пароль'}</p>

      <form class="auth-form" data-auth-form novalidate>
        <label class="field">
          <span class="field__label">Юзернейм</span>
          <input
            class="field__input"
            type="text"
            name="username"
            autocomplete="username"
            placeholder="username"
            required
          />
        </label>
        <label class="field">
          <span class="field__label">Пароль</span>
          <input
            class="field__input"
            type="password"
            name="password"
            autocomplete="${isRegister ? 'new-password' : 'current-password'}"
            placeholder="••••••"
            required
          />
        </label>
        <label class="auth-remember">
          <input type="checkbox" name="remember" checked />
          <span>Запоминать и не выходить</span>
        </label>
        <p class="auth-form__error" data-auth-error role="alert" hidden></p>
        <button class="button button--primary auth-form__submit" type="submit" data-auth-submit>
          ${isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <p class="auth-page__switch">
        ${isRegister
          ? 'Уже есть аккаунт? <a href="#/login">Войти</a>'
          : 'Нет аккаунта? <a href="#/register">Регистрация</a>'}
      </p>
    </div>
  `;

  function mount(root) {
    const cleanupThemeToggle = themeToggle.mount(root);
    const form = root.querySelector('[data-auth-form]');
    const error = form.querySelector('[data-auth-error]');
    const submit = form.querySelector('[data-auth-submit]');

    async function handleSubmit(event) {
      event.preventDefault();
      const data = new FormData(form);
      error.hidden = true;
      submit.disabled = true;

      try {
        const credentials = {
          username: data.get('username'),
          password: data.get('password'),
          remember: data.get('remember') !== null,
        };
        const result = isRegister
          ? await authService.register(credentials)
          : await authService.login(credentials);

        if (!result.ok) {
          error.textContent = result.error;
          error.hidden = false;
          return;
        }

        onSuccess(result.user);
      } catch {
        error.textContent = 'Не удалось войти. Попробуй ещё раз.';
        error.hidden = false;
      } finally {
        submit.disabled = false;
      }
    }

    form.addEventListener('submit', handleSubmit);
    return () => {
      cleanupThemeToggle();
      form.removeEventListener('submit', handleSubmit);
    };
  }

  return { html, mount };
}
