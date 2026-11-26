/** Роль создателя есть только у @murs. */
export function isCreator(user) {
  if (!user) return false;
  return user.handle === 'murs' || user.username === 'murs';
}
