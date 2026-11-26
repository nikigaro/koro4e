const PREFIX = 'enc:v1:';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

/**
 * Шифрование сообщений при хранении: AES-GCM, ключ выводится из секрета аккаунта.
 * Защищает от прямого чтения localStorage, но не от доступа к самому аккаунту.
 */
export function createMessageCipher({ getSecret }) {
  let cachedSecret = null;
  let cachedKey = null;

  async function getKey() {
    const secret = String(getSecret() ?? 'koroche');
    if (cachedKey && cachedSecret === secret) return cachedKey;

    const material = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    cachedKey = await crypto.subtle.deriveKey(
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
    cachedSecret = secret;
    return cachedKey;
  }

  async function encrypt(text) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(String(text)),
    );

    return `${PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
  }

  async function decrypt(value) {
    const raw = String(value ?? '');
    if (!raw.startsWith(PREFIX)) return raw;

    try {
      const key = await getKey();
      const [ivPart, dataPart] = raw.slice(PREFIX.length).split('.');
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(ivPart) },
        key,
        fromBase64(dataPart),
      );
      return decoder.decode(decrypted);
    } catch {
      return raw;
    }
  }

  function invalidate() {
    cachedSecret = null;
    cachedKey = null;
  }

  return { encrypt, decrypt, invalidate };
}
