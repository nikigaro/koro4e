import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_STATE_ID,
} from '../config/supabase.js';

const ENDPOINT = `${SUPABASE_URL}/rest/v1/koroche_state`;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// Сессия остаётся локальной, остальные данные, включая хеши паролей, синхронизируются.
function forRemote(state) {
  const { sessionUserId, rememberMe, ...data } = state;
  return data;
}

function mergeById(local = [], remote = [], deleted = new Set()) {
  const merged = new Map();
  remote.forEach((item) => merged.set(item.id, item));
  local.forEach((item) => merged.set(item.id, { ...merged.get(item.id), ...item }));
  return [...merged.values()].filter((item) => !deleted.has(item.id));
}

function mergeUsers(local = [], remote = []) {
  const merged = new Map();
  remote.forEach((user) => merged.set(user.id, user));
  local.forEach((user) => {
    const saved = merged.get(user.id);
    const lastSeen = Math.max(user.lastSeen ?? 0, saved?.lastSeen ?? 0);
    merged.set(user.id, {
      ...saved,
      ...user,
      auth: user.auth ?? saved?.auth,
      lastSeen: lastSeen || undefined,
      isOnline: Date.now() - lastSeen < 45_000,
    });
  });
  return [...merged.values()];
}

/** Объединение данных с учётом удалений, чтобы удалённое не возвращалось из Supabase. */
export function mergeStates(local, remote) {
  if (!remote || typeof remote !== 'object') return local;

  const deleted = new Set([
    ...(local.deletedIds ?? []),
    ...(remote.deletedIds ?? []),
  ]);

  return {
    ...local,
    ...remote,
    users: mergeUsers(local.users, remote.users),
    posts: mergeById(local.posts, remote.posts, deleted),
    news: mergeById(local.news, remote.news, deleted),
    media: mergeById(local.media, remote.media, deleted),
    audio: mergeById(local.audio, remote.audio, deleted),
    messages: mergeById(local.messages, remote.messages, deleted),
    devices: mergeById(local.devices, remote.devices, deleted),
    chatAgreements: [...new Set([
      ...(local.chatAgreements ?? []),
      ...(remote.chatAgreements ?? []),
    ])],
    deletedIds: [...deleted].slice(-1000),
    sessionUserId: local.sessionUserId,
    rememberMe: local.rememberMe,
  };
}

export async function loadRemoteState() {
  const url = `${ENDPOINT}?id=eq.${encodeURIComponent(SUPABASE_STATE_ID)}&select=data&limit=1`;
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    throw new Error(`Supabase: чтение не удалось (${response.status})`);
  }

  const rows = await response.json();
  return rows[0]?.data ?? null;
}

export async function saveRemoteState(state) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify([{
      id: SUPABASE_STATE_ID,
      data: forRemote(state),
      updated_at: new Date().toISOString(),
    }]),
  });

  if (!response.ok) {
    throw new Error(`Supabase: запись не удалась (${response.status})`);
  }
}
