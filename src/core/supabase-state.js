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
  local.forEach((item) => {
    const saved = merged.get(item.id);
    if (!saved || (item.updatedAt ?? 0) > (saved.updatedAt ?? 0)) {
      merged.set(item.id, item);
    }
  });
  return [...merged.values()].filter((item) => !deleted.has(item.id));
}

function mergeUsers(local = [], remote = [], deleted = new Set()) {
  const merged = new Map();
  remote.forEach((user) => merged.set(user.id, user));
  local.forEach((user) => {
    const saved = merged.get(user.id);
    if (!saved) {
      merged.set(user.id, user);
      return;
    }

    const newer = (user.updatedAt ?? 0) > (saved.updatedAt ?? 0) ? user : saved;
    const lastSeen = Math.max(user.lastSeen ?? 0, saved.lastSeen ?? 0);
    merged.set(user.id, {
      ...newer,
      auth: user.auth ?? saved.auth,
      lastSeen: lastSeen || undefined,
      isOnline: Date.now() - lastSeen < 45_000,
    });
  });
  return [...merged.values()].filter((user) => !deleted.has(user.id));
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
    users: mergeUsers(local.users, remote.users, deleted),
    posts: mergeById(local.posts, remote.posts, deleted),
    news: mergeById(local.news, remote.news, deleted),
    media: mergeById(local.media, remote.media, deleted),
    audio: mergeById(local.audio, remote.audio, deleted),
    messages: mergeById(local.messages, remote.messages, deleted),
    chatPins: mergeById(local.chatPins, remote.chatPins, deleted),
    devices: mergeById(local.devices, remote.devices, deleted),
    chatAgreements: [...new Set([
      ...(local.chatAgreements ?? []),
      ...(remote.chatAgreements ?? []),
    ])],
    deletedIds: [...deleted].slice(-1000),
    bans: mergeById(local.bans, remote.bans, deleted),
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
