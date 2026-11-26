/** Стартовые аватарки, которые выдаются при регистрации. */
const INITIAL_AVATARS = [
  './assets/avatars/avatar-e.png',
  './assets/avatars/avatar-k.png',
  './assets/avatars/avatar-o.png',
  './assets/avatars/avatar-p.png',
  './assets/avatars/avatar-ch.png',
];

export function listInitialAvatars() {
  return INITIAL_AVATARS;
}

/** Выбирает случайную стартовую аватарку. */
export function pickInitialAvatar() {
  const index = Math.floor(Math.random() * INITIAL_AVATARS.length);
  return INITIAL_AVATARS[index];
}
