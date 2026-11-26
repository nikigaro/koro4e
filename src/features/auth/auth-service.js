import { createId } from '../../shared/utils/create-id.js';
import { pickInitialAvatar } from '../users/initial-avatars.js';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 4;

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validateCredentials(username, password) {
  const name = normalizeUsername(username);
  if (!USERNAME_PATTERN.test(name)) {
    return { error: 'Юзернейм от 3 до 20 символов, латиница, цифры и подчёркивание' };
  }
  if (String(password ?? '').length < MIN_PASSWORD_LENGTH) {
    return { error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` };
  }
  return { username: name };
}

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Регистрация и вход только по юзернейму и паролю. */
export function createAuthService({ store, usersService }) {
  async function register({ username, password, remember }) {
    const valid = validateCredentials(username, password);
    if (valid.error) return { ok: false, error: valid.error };
    if (usersService.findByUsername(valid.username)) {
      return { ok: false, error: 'Этот юзернейм уже занят' };
    }

    const salt = createId('salt');
    const hash = await hashPassword(password, salt);
    const user = {
      id: createId('user'),
      username: valid.username,
      name: valid.username,
      handle: valid.username,
      color: '#23dcb7',
      avatar: pickInitialAvatar(),
      auth: { salt, hash },
    };

    store.setState((state) => ({
      ...state,
      users: [...state.users, user],
      sessionUserId: user.id,
      rememberMe: Boolean(remember),
    }));

    return { ok: true, user };
  }

  async function login({ username, password, remember }) {
    const user = usersService.findByUsername(username);
    if (!user?.auth) return { ok: false, error: 'Неверный юзернейм или пароль' };

    const hash = await hashPassword(password, user.auth.salt);
    if (hash !== user.auth.hash) {
      return { ok: false, error: 'Неверный юзернейм или пароль' };
    }

    store.setState((state) => ({
      ...state,
      sessionUserId: user.id,
      rememberMe: Boolean(remember),
    }));
    return { ok: true, user };
  }

  function logout() {
    store.setState((state) => ({ ...state, sessionUserId: null, rememberMe: false }));
  }

  return { register, login, logout };
}
