/** Сервис пользователей: поиск по юзернейму и текущая сессия. */

const UNKNOWN_USER = {
  id: 'unknown',
  name: 'Неизвестный',
  handle: 'unknown',
  color: '#9ca3af',
};

export function createUsersService(store) {
  function listUsers() {
    return store.getState().users;
  }

  function getUserById(id) {
    return listUsers().find((user) => user.id === id) ?? UNKNOWN_USER;
  }

  function findByUsername(username) {
    const handle = String(username ?? '').trim().toLowerCase();
    return listUsers().find((user) => user.handle === handle) ?? null;
  }

  function getCurrentUser() {
    const { sessionUserId } = store.getState();
    if (!sessionUserId) return null;
    return listUsers().find((user) => user.id === sessionUserId) ?? null;
  }

  function updateCurrentUser(patch) {
    const { sessionUserId } = store.getState();
    if (!sessionUserId) return null;

    store.setState((state) => ({
      ...state,
      users: state.users.map((user) => user.id === sessionUserId
        ? { ...user, ...patch, updatedAt: Date.now() }
        : user),
    }));

    return getCurrentUser();
  }

  return { listUsers, getUserById, findByUsername, getCurrentUser, updateCurrentUser };
}
