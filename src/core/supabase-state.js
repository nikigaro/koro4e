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

function mergeById(local = [], remote = []) {
  const merged = new Map();
  remote.forEach((item) => merged.set(item.id, item));
  local.forEach((item) => merged.set(item.id, { ...merged.get(item.id), ...item }));
  return [...merged.values()];
}

function mergeUsers(local = [], remote = []) {
  const merged = new Map();
  remote.forEach((user) => merged.set(user.id, user));
  local.forEach((user) => {
    const saved = merged.get(user.id);
    merged.set(user.id, { ...saved, ...user, auth: user.auth ?? saved?.auth });
  });
  return [...merged.values()];
}

/** Объединяет локальные данные и Supabase, не теряя аккаунты из-за пустого облака. */
export function mergeStates(local, remote) {
  if (!remote || typeof remote !== 'object') return local;

  return {
    ...local,
    ...remote,
    users: mergeUsers(local.users, remote.users),
    posts: mergeById(local.posts, remote.posts),
    media: mergeById(local.media, remote.media),
    audio: mergeById(local.audio, remote.audio),
    messages: mergeById(local.messages, remote.messages),
    devices: mergeById(local.devices, remote.devices),
    chatAgreements: [...new Set([
      ...(local.chatAgreements ?? []),
      ...(remote.chatAgreements ?? []),
    ])],
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
