import { escapeHtml } from '../../shared/utils/escape-html.js';

const AGREEMENT_PARAGRAPHS = [
  'Заходя в чат, вы осознаёте и соглашаетесь, что разработчики сайта не несут ответственности за сообщения там.',
  'Если вам написали что-то нездоровое (угрозы, странные предложения, всё, что нарушает правила), вы обязуетесь пожаловаться, и тогда мы разберёмся.',
  'При входе в чат вы подтверждаете, что прочитали правила.',
];

/** Соглашение, которое показывается до первого входа в чат. */
export function createChatAgreement({ visible, onAccept, onDecline }) {
  const html = `
    <div class="chat-agreement" data-chat-agreement ${visible ? '' : 'hidden'}>
      <div class="chat-agreement__card" role="dialog" aria-modal="true" aria-labelledby="chat-agreement-title">
        <h2 class="chat-agreement__title" id="chat-agreement-title">Пользовательское соглашение</h2>
        <div class="chat-agreement__text">
          ${AGREEMENT_PARAGRAPHS.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
        </div>
        <p class="chat-agreement__note">Полные правила: <a href="#/rules">Правила</a>.</p>
        <div class="chat-agreement__actions">
          <button class="button" type="button" data-agreement-decline>Назад</button>
          <button class="button button--primary" type="button" data-agreement-accept>Я прочитал и согласен</button>
        </div>
      </div>
    </div>
  `;

  function mount(root) {
    const modal = root.querySelector('[data-chat-agreement]');
    if (!modal || modal.hidden) return () => {};

    const accept = modal.querySelector('[data-agreement-accept]');
    const decline = modal.querySelector('[data-agreement-decline]');

    function handleAccept() {
      modal.hidden = true;
      onAccept?.();
    }

    function handleDecline() {
      onDecline?.();
    }

    function handleKey(event) {
      if (event.key === 'Escape' && !modal.hidden) handleDecline();
    }

    accept.addEventListener('click', handleAccept);
    decline.addEventListener('click', handleDecline);
    document.addEventListener('keydown', handleKey);

    return () => {
      accept.removeEventListener('click', handleAccept);
      decline.removeEventListener('click', handleDecline);
      document.removeEventListener('keydown', handleKey);
    };
  }

  return { html, mount };
}
