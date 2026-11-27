import { createId } from '../../shared/utils/create-id.js';
import { isCreator } from '../users/roles.js';

/** Блокировки аккаунтов и устройств. Удаляет все данные забаненного пользователя. */
export function createBanService({ store, usersService, devicesService }) {
  function list() {
    return store.getState().bans ?? [];
  }

  function canBan() {
    return isCreator(usersService.getCurrentUser());
  }

  function isUserBanned(userId) {
    return Boolean(usersService.getUserById(userId)?.banned)
      || list().some((ban) => ban.userId === userId);
  }

  function isDeviceBanned(deviceId) {
    return list().some((ban) => ban.deviceId === deviceId);
  }

  function isCurrentBlocked() {
    const me = usersService.getCurrentUser();
    if (!me) return false;
    return isUserBanned(me.id) || isDeviceBanned(devicesService.getDeviceId());
  }

  function addBans(bans) {
    store.setState((state) => ({
      ...state,
      bans: [...(state.bans ?? []), ...bans],
    }));
  }

  function removeBan(id) {
    if (!canBan()) return false;
    store.setState((state) => ({
      ...state,
      bans: (state.bans ?? []).filter((ban) => ban.id !== id),
    }));
    return true;
  }

  function banUser(userId) {
    if (!canBan()) return false;

    const target = usersService.getUserById(userId);
    const me = usersService.getCurrentUser();
    if (!target?.id || target.id === 'unknown' || target.id === me.id || target.banned) return false;

    const now = Date.now();
    store.setState((state) => {
      const removedIds = [];

      (state.posts ?? []).forEach((post) => {
        if (post.authorId === userId || post.wallOwnerId === userId) removedIds.push(post.id);
      });
      (state.media ?? []).forEach((item) => {
        if (item.authorId === userId) removedIds.push(item.id);
      });
      (state.audio ?? []).forEach((track) => {
        if (track.authorId === userId) removedIds.push(track.id);
      });
      (state.messages ?? []).forEach((message) => {
        if (message.fromId === userId || message.toId === userId) removedIds.push(message.id);
      });
      (state.devices ?? []).forEach((device) => {
        if (device.userId === userId) removedIds.push(device.id);
      });

      const deletedIds = [...new Set([...(state.deletedIds ?? []), ...removedIds])];

      return {
        ...state,
        posts: (state.posts ?? []).filter((post) => !removedIds.includes(post.id)),
        media: (state.media ?? []).filter((item) => !removedIds.includes(item.id)),
        audio: (state.audio ?? []).filter((track) => !removedIds.includes(track.id)),
        messages: (state.messages ?? []).filter((message) => !removedIds.includes(message.id)),
        devices: (state.devices ?? []).filter((device) => !removedIds.includes(device.id)),
        chatAgreements: (state.chatAgreements ?? []).filter((id) => id !== userId),
        users: (state.users ?? []).map((user) => (user.id === userId
          ? {
            ...user,
            banned: true,
            avatar: null,
            banner: null,
            about: '',
            auth: null,
            color: '#9ca3af',
            lastSeen: 0,
            isOnline: false,
            updatedAt: now,
          }
          : user)),
        bans: [...(state.bans ?? []), {
          id: createId('ban'),
          userId,
          at: now,
          updatedAt: now,
        }],
        deletedIds: deletedIds.slice(-1000),
        sessionUserId: state.sessionUserId === userId ? null : state.sessionUserId,
      };
    });
    return true;
  }

  function unbanUser(userId) {
    if (!canBan()) return false;
    store.setState((state) => ({
      ...state,
      bans: (state.bans ?? []).filter((ban) => ban.userId !== userId),
      users: (state.users ?? []).map((user) => (user.id === userId
        ? { ...user, banned: false, updatedAt: Date.now() }
        : user)),
    }));
    return true;
  }

  function banDevice(deviceId) {
    if (!canBan() || deviceId === devicesService.getDeviceId()) return false;
    if (isDeviceBanned(deviceId)) return false;

    const now = Date.now();
    addBans([{
      id: createId('ban-device'),
      deviceId,
      at: now,
      updatedAt: now,
    }]);
    return true;
  }

  function unbanDevice(deviceId) {
    if (!canBan()) return false;
    store.setState((state) => ({
      ...state,
      bans: (state.bans ?? []).filter((ban) => ban.deviceId !== deviceId),
    }));
    return true;
  }

  return {
    list,
    canBan,
    isUserBanned,
    isDeviceBanned,
    isCurrentBlocked,
    banUser,
    unbanUser,
    banDevice,
    unbanDevice,
    removeBan,
  };
}
