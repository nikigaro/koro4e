import { escapeHtml } from '../../shared/utils/escape-html.js';
import { formatTime } from '../../shared/utils/format-time.js';
import { renderAvatar } from '../../shared/ui/avatar.js';
import { renderRichText, renderUserLink } from '../../shared/utils/render-rich-text.js';
import { createChatAgreement } from './chat-agreement.js';
import { CHAT_MESSAGE_LIMIT } from './chat-service.js';

function renderMessage(message, { isOwn, author, users }) {
  return `
    <article class="chat-message ${isOwn ? 'chat-message--own' : ''}">
      ${isOwn ? '' : renderAvatar(author)}
      <div class="chat-message__body">
        <p class="chat-message__text">${renderRichText(message.text, users)}</p>
        <time class="chat-message__time">${escapeHtml(formatTime(message.createdAt))}</time>
      </div>
    </article>
  `;
}

/** Переписка с одним пользователем: история и отправка сообщений. */
export function createChatThreadView({ store, usersService, chatService, userId }) {
  const currentUser = usersService.getCurrentUser();
  const other = usersService.listUsers().find((user) => user.id === userId);

  if (!other || other.id === currentUser.id) {
    const html = `
      <section class="chat-page">
        <a class="chat-thread__back" href="#/chat">← К чатам</a>
        <div class="empty">Пользователь не найден.</div>
      </section>
    `;
    return { html, mount: () => () => {} };
  }

  const needsAgreement = !chatService.hasAcceptedAgreement();
  let pageNode = null;
  let inputNode = null;

  const agreement = createChatAgreement({
    visible: needsAgreement,
    onAccept: () => {
      chatService.acceptAgreement();
      pageNode?.removeAttribute('inert');
      inputNode?.focus();
    },
    onDecline: () => {
      location.hash = '#/feed';
    },
  });

  const html = `
    <section class="chat-page chat-thread" data-chat-page ${needsAgreement ? 'inert' : ''}>
      <header class="chat-thread__header">
        <a class="chat-thread__back" href="#/chat">← Назад</a>
        ${renderAvatar(other)}
        <div class="chat-thread__identity">
          <strong>${renderUserLink(other)}</strong>
          <span>Личные сообщения</span>
        </div>
      </header>

      <div class="chat-thread__messages" data-chat-messages></div>

      <form class="chat-composer" data-chat-form>
        <textarea
          class="chat-composer__input"
          data-chat-input
          rows="1"
          maxlength="${CHAT_MESSAGE_LIMIT}"
          placeholder="Написать сообщение..."
          aria-label="Сообщение"
        ></textarea>
        <button class="button button--primary" type="submit">Отправить</button>
      </form>
    </section>
    ${agreement.html}
  `;

  function mount(root) {
    pageNode = root.querySelector('[data-chat-page]');
    inputNode = root.querySelector('[data-chat-input]');
    const messagesNode = root.querySelector('[data-chat-messages]');
    const form = root.querySelector('[data-chat-form]');

    function renderMessages() {
      const messages = chatService.listMessages(other.id);
      messagesNode.innerHTML = messages.length
        ? messages.map((message) => renderMessage(message, {
          isOwn: message.fromId === currentUser.id,
          author: other,
          users: usersService.listUsers(),
        })).join('')
        : '<div class="chat-thread__empty">Пока нет сообщений. Напиши первым.</div>';
      messagesNode.scrollTop = messagesNode.scrollHeight;
    }

    async function handleSubmit(event) {
      event.preventDefault();
      if (await chatService.send(other.id, inputNode.value)) {
        inputNode.value = '';
        inputNode.focus();
      }
    }

    function handleKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    }

    const cleanupAgreement = agreement.mount(root);
    renderMessages();
    form.addEventListener('submit', handleSubmit);
    inputNode.addEventListener('keydown', handleKeydown);
    const unsubscribe = store.subscribe(renderMessages);

    return () => {
      unsubscribe();
      form.removeEventListener('submit', handleSubmit);
      inputNode.removeEventListener('keydown', handleKeydown);
      cleanupAgreement();
      pageNode = null;
      inputNode = null;
    };
  }

  return { html, mount };
}
