import { escapeHtml } from '../../shared/utils/escape-html.js';
import { formatTime } from '../../shared/utils/format-time.js';
import { renderAvatar } from '../../shared/ui/avatar.js';
import { renderUserLink } from '../../shared/utils/render-rich-text.js';
import { createChatAgreement } from './chat-agreement.js';

function renderConversation({ user, last }, currentUserId) {
  const prefix = last.fromId === currentUserId ? 'Вы: ' : '';

  return `
    <a class="chat-conversation" href="#/chat/${encodeURIComponent(user.id)}">
      ${renderAvatar(user)}
      <div class="chat-conversation__body">
        <div class="chat-conversation__top">
          <strong>${renderUserLink(user)}</strong>
          <time>${escapeHtml(formatTime(last.createdAt))}</time>
        </div>
        <p class="chat-conversation__preview">${prefix}${escapeHtml(last.text)}</p>
      </div>
    </a>
  `;
}

/** Список личных переписок и поиск собеседника по @username. */
export function createChatView({ store, usersService, chatService }) {
  const currentUser = usersService.getCurrentUser();
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

  const people = usersService.listUsers()
    .filter((user) => user.id !== currentUser.id)
    .map((user) => `<option value="@${escapeHtml(user.handle)}"></option>`)
    .join('');

  const html = `
    <section class="chat-page" data-chat-page ${needsAgreement ? 'inert' : ''}>
      <header class="chat-page__header">
        <h1 class="info-page__title">Чат</h1>
        <p class="info-page__intro">Личные сообщения. Начни переписку по @username.</p>
      </header>

      <form class="chat-start" data-chat-start>
        <label class="field chat-start__field">
          <span class="field__label">Кому написать</span>
          <input
            class="field__input"
            type="text"
            data-chat-user
            list="chat-users"
            placeholder="@username"
            autocomplete="off"
          />
          <datalist id="chat-users">${people}</datalist>
        </label>
        <button class="button button--primary" type="submit">Написать</button>
      </form>
      <p class="chat-start__error" data-chat-error role="alert" hidden></p>

      <div class="chat-list" data-chat-list></div>
    </section>
    ${agreement.html}
  `;

  function mount(root) {
    pageNode = root.querySelector('[data-chat-page]');
    inputNode = root.querySelector('[data-chat-user]');
    const form = root.querySelector('[data-chat-start]');
    const error = root.querySelector('[data-chat-error]');
    const list = root.querySelector('[data-chat-list]');

    function showError(text) {
      error.textContent = text;
      error.hidden = false;
    }

    function renderList() {
      const conversations = chatService.listConversations();
      list.innerHTML = conversations.length
        ? conversations.map((item) => renderConversation(item, currentUser.id)).join('')
        : '<div class="empty">Пока нет переписок. Напиши первым по @username.</div>';
    }

    function handleSubmit(event) {
      event.preventDefault();
      const handle = inputNode.value.trim().replace(/^@/, '').toLowerCase();
      if (!handle) {
        showError('Введи @username');
        return;
      }

      const user = usersService.findByUsername(handle);
      if (!user) {
        showError('Пользователь с таким @ не найден');
        return;
      }
      if (user.id === currentUser.id) {
        showError('Нельзя писать самому себе');
        return;
      }

      error.hidden = true;
      location.hash = `#/chat/${encodeURIComponent(user.id)}`;
    }

    function handleInput() {
      error.hidden = true;
    }

    const cleanupAgreement = agreement.mount(root);
    renderList();
    form.addEventListener('submit', handleSubmit);
    inputNode.addEventListener('input', handleInput);
    const unsubscribe = store.subscribe(renderList);

    return () => {
      unsubscribe();
      form.removeEventListener('submit', handleSubmit);
      inputNode.removeEventListener('input', handleInput);
      cleanupAgreement();
      pageNode = null;
      inputNode = null;
    };
  }

  return { html, mount };
}
