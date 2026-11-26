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

// Пароли и соль остаются только в браузере, в облако уходят только данные.
function withoutAuth(state) {
  return {
    ...state,
    users: (state.users ?? []).map(({ auth, ...user }) => user),
  };
}

/** Соединяет локальную сессию и фильтры с данными из Supabase. */
export function mergeStates(local, remote) {
  if (!remote || typeof remote !== 'object') return local;

  const localAuth = new Map((local.users ?? []).map((user) => [user.id, user.auth]));

  return {
    ...local,
    ...remote,
    users: (remote.users ?? local.users ?? []).map((user) => ({
      ...user,
      auth: localAuth.get(user.id) ?? user.auth,
    })),
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
      data: withoutAuth(state),
      updated_at: new Date().toISOString(),
    }]),
  });

  if (!response.ok) {
    throw new Error(`Supabase: запись не удалась (${response.status})`);
  }
}
