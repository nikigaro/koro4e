import { createId } from '../../shared/utils/create-id.js';
import { createMessageCipher } from '../../shared/crypto/message-cipher.js';

export const CHAT_MESSAGE_LIMIT = 1000;

/** Личные сообщения: переписки, отправка и согласие на вход в чат. */
export function createChatService({ store, usersService }) {
  const cipher = createMessageCipher({
    getSecret: () => {
      const user = usersService.getCurrentUser();
      return user?.auth ? `${user.auth.salt}:${user.auth.hash}` : 'koroche';
    },
  });

  // Расшифрованные тексты живут только в памяти, в localStorage лежит шифртекст.
  const decryptedTexts = new Map();

  function textOf(message) {
    const text = decryptedTexts.get(message.id) ?? message.text;
    return String(text).startsWith('enc:v1:') ? 'Зашифрованное сообщение' : text;
  }

  function withPlainText(message) {
    return message ? { ...message, text: textOf(message) } : message;
  }

  async function hydrate() {
    if (!currentUserId()) return;

    const messages = store.getState().messages ?? [];
    const results = await Promise.all(messages.map(async (message) => {
      const plain = await cipher.decrypt(message.text);
      const wasPlain = !String(message.text).startsWith('enc:v1:');
      return {
        id: message.id,
        plain,
        encrypted: wasPlain ? await cipher.encrypt(plain) : null,
      };
    }));

    decryptedTexts.clear();
    const encryptedById = new Map();
    results.forEach(({ id, plain, encrypted }) => {
      decryptedTexts.set(id, plain);
      if (encrypted) encryptedById.set(id, encrypted);
    });

    // Старые сообщения в открытом виде один раз переводим в шифртекст.
    if (encryptedById.size) {
      store.setState((state) => ({
        ...state,
        messages: (state.messages ?? []).map((message) => (
          encryptedById.has(message.id)
            ? { ...message, text: encryptedById.get(message.id) }
            : message
        )),
      }));
    }
  }

  function clearCache() {
    decryptedTexts.clear();
    cipher.invalidate();
  }

  /** Расшифровывает сообщения, пришедшие из другой вкладки или браузера. */
  async function decryptMissing() {
    const messages = store.getState().messages ?? [];
    const missing = messages.filter((message) => !decryptedTexts.has(message.id));
    if (!missing.length) return false;

    await Promise.all(missing.map(async (message) => {
      decryptedTexts.set(message.id, await cipher.decrypt(message.text));
    }));
    return true;
  }

  function currentUserId() {
    return usersService.getCurrentUser()?.id ?? null;
  }

  function listMessages(userId) {
    const me = currentUserId();
    if (!me || !userId) return [];

    return (store.getState().messages ?? [])
      .filter((message) => (
        (message.fromId === me && message.toId === userId)
        || (message.fromId === userId && message.toId === me)
      ))
      .sort((left, right) => left.createdAt - right.createdAt)
      .map(withPlainText);
  }

  function listConversations() {
    const me = currentUserId();
    if (!me) return [];

    const lastByUser = new Map();
    (store.getState().messages ?? []).forEach((message) => {
      if (message.fromId !== me && message.toId !== me) return;
      const otherId = message.fromId === me ? message.toId : message.fromId;
      const previous = lastByUser.get(otherId);
      if (!previous || message.createdAt > previous.createdAt) {
        lastByUser.set(otherId, message);
      }
    });

    return Array.from(lastByUser.entries())
      .map(([userId, last]) => ({
        user: usersService.getUserById(userId),
        last: withPlainText(last),
      }))
      .sort((left, right) => right.last.createdAt - left.last.createdAt);
  }

  async function send(toId, text) {
    const me = currentUserId();
    const body = String(text ?? '').trim();
    if (!me || !toId || me === toId || !body) return null;

    const encrypted = await cipher.encrypt(body.slice(0, CHAT_MESSAGE_LIMIT));
    const message = {
      id: createId('message'),
      fromId: me,
      toId,
      text: encrypted,
      createdAt: Date.now(),
    };

    decryptedTexts.set(message.id, body.slice(0, CHAT_MESSAGE_LIMIT));
    store.setState((state) => ({
      ...state,
      messages: [...(state.messages ?? []), message],
    }));

    return message;
  }

  function hasAcceptedAgreement() {
    const me = currentUserId();
    if (!me) return false;
    return (store.getState().chatAgreements ?? []).includes(me);
  }

  function acceptAgreement() {
    const me = currentUserId();
    if (!me) return;

    store.setState((state) => {
      const accepted = state.chatAgreements ?? [];
      if (accepted.includes(me)) return state;
      return { ...state, chatAgreements: [...accepted, me] };
    });
  }

  return {
    hydrate,
    clearCache,
    decryptMissing,
    listMessages,
    listConversations,
    send,
    hasAcceptedAgreement,
    acceptAgreement,
  };
}
