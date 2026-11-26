const SHARED_SECRET = 'koroche-shared-v1';
const PREFIX = 'enc:v1:';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(secret) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('koroche-chat-v1'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Шифрование сообщений при хранении. Новые сообщения шифруются общим ключом
 * приложения, поэтому их видит любой участник. Старые сообщения пробуем открыть
 * ключами всех аккаунтов, чтобы ничего не потерять при обновлении.
 */
export function createMessageCipher({ getSecrets } = {}) {
  let cachedSignature = null;
  let cachedKeys = null;

  async function getKeys() {
    const accountSecrets = (getSecrets?.() ?? []).filter(Boolean).map(String);
    const secrets = [...new Set([SHARED_SECRET, ...accountSecrets])];
    const signature = secrets.join('|');
    if (cachedKeys && cachedSignature === signature) return cachedKeys;

    cachedKeys = await Promise.all(secrets.map(deriveKey));
    cachedSignature = signature;
    return cachedKeys;
  }

  async function encrypt(text) {
    const keys = await getKeys();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keys[0],
      encoder.encode(String(text)),
    );

    return `${PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
  }

  async function decrypt(value) {
    const raw = String(value ?? '');
    if (!raw.startsWith(PREFIX)) return raw;

    const keys = await getKeys();
    const [ivPart, dataPart] = raw.slice(PREFIX.length).split('.');
    const iv = fromBase64(ivPart);
    const data = fromBase64(dataPart);

    for (const key of keys) {
      try {
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        return decoder.decode(decrypted);
      } catch {
        // Пробуем следующий ключ.
      }
    }
    return raw;
  }

  function invalidate() {
    cachedSignature = null;
    cachedKeys = null;
  }

  return { encrypt, decrypt, invalidate };
}
