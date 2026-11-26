const ONLINE_WINDOW = 45_000;
const HEARTBEAT = 15_000;

/** Признак онлайна по времени последнего визита, который синхронизируется через Supabase. */
export function createPresenceService({ store, usersService }) {
  let timer = null;

  function ping() {
    const me = usersService.getCurrentUser();
    if (!me) return false;

    const now = Date.now();
    store.setState((state) => ({
      ...state,
      users: (state.users ?? []).map((user) => ({
        ...user,
        lastSeen: user.id === me.id ? now : user.lastSeen,
        isOnline: user.id === me.id || now - (user.lastSeen ?? 0) < ONLINE_WINDOW,
      })),
    }));
    return true;
  }

  function isOnline(userId) {
    const user = usersService.getUserById(userId);
    if (!user?.id || user.id === 'unknown') return false;
    return Boolean(user.isOnline);
  }

  function start() {
    stop();
    ping();
    timer = window.setInterval(ping, HEARTBEAT);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  return { ping, isOnline, start, stop };
}
