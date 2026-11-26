import { createId } from '../../shared/utils/create-id.js';

const DEVICE_KEY = 'koroche.device.id';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = createId('device');
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function deviceName() {
  const agent = navigator.userAgent;
  const os = /Windows/i.test(agent) ? 'Windows'
    : /Android/i.test(agent) ? 'Android'
      : /iPhone|iPad/i.test(agent) ? 'iOS'
        : /Mac/i.test(agent) ? 'macOS' : 'Другое';

  const browser = /Edg\//.test(agent) ? 'Edge'
    : /Chrome\//.test(agent) ? 'Chrome'
      : /Firefox\//.test(agent) ? 'Firefox'
        : /Safari\//.test(agent) ? 'Safari' : 'Браузер';

  return `${os}, ${browser}`;
}

/** Устройства аккаунта: первое при регистрации основное, остальные ждут подтверждения. */
export function createDevicesService({ store, usersService }) {
  function listForUser(userId) {
    return (store.getState().devices ?? []).filter((device) => device.userId === userId);
  }

  function getCurrentDevice(userId) {
    return listForUser(userId).find((device) => device.id === getDeviceId()) ?? null;
  }

  function ensureDevice(userId) {
    if (!userId) return null;

    const existing = getCurrentDevice(userId);
    if (existing) return existing;

    const hasPrimary = listForUser(userId).some((device) => device.primary);
    const device = {
      id: getDeviceId(),
      userId,
      name: deviceName(),
      primary: !hasPrimary,
      approved: !hasPrimary,
      createdAt: Date.now(),
    };

    store.setState((state) => ({
      ...state,
      devices: [...(state.devices ?? []), device],
    }));

    return device;
  }

  function isAllowed(userId) {
    return Boolean(getCurrentDevice(userId)?.approved);
  }

  function isPrimary(userId) {
    return Boolean(getCurrentDevice(userId)?.primary);
  }

  function approve(id) {
    store.setState((state) => ({
      ...state,
      devices: (state.devices ?? []).map((device) => (
        device.id === id ? { ...device, approved: true } : device
      )),
    }));
  }

  function revoke(id) {
    store.setState((state) => ({
      ...state,
      devices: (state.devices ?? []).map((device) => (
        device.id === id && !device.primary ? { ...device, approved: false } : device
      )),
    }));
  }

  return {
    listForUser,
    getCurrentDevice,
    ensureDevice,
    isAllowed,
    isPrimary,
    approve,
    revoke,
    getDeviceId,
  };
}
