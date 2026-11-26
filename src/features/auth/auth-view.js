import { createAuthForm } from './auth-form.js';

/** Страница регистрации или входа. */
export function createAuthView({ mode, authService, onAuthenticated }) {
  const form = createAuthForm({
    mode,
    authService,
    onSuccess: onAuthenticated,
  });

  const html = `<div class="auth-page">${form.html}</div>`;

  function mount(root) {
    return form.mount(root.querySelector('.auth-page'));
  }

  return { html, mount };
}
