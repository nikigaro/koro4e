import { escapeHtml } from '../../shared/utils/escape-html.js';

const MAX_ABOUT_LENGTH = 300;

/** Поле «О себе» прямо в профиле, под ником. */
export function createAboutEditor({ user, onSave }) {
  const html = `
    <div class="about-editor">
      <textarea
        class="about-editor__input"
        data-about
        maxlength="${MAX_ABOUT_LENGTH}"
        placeholder="Расскажи о себе"
      >${escapeHtml(user.about ?? '')}</textarea>
      <div class="about-editor__footer">
        <span class="about-editor__counter" data-about-counter>0/${MAX_ABOUT_LENGTH}</span>
        <button class="button" type="button" data-save-about>Сохранить</button>
      </div>
    </div>
  `;

  function mount(root) {
    const input = root.querySelector('[data-about]');
    const counter = root.querySelector('[data-about-counter]');
    const button = root.querySelector('[data-save-about]');

    function sync() {
      counter.textContent = `${input.value.length}/${MAX_ABOUT_LENGTH}`;
    }

    function handleSave() {
      onSave(input.value.trim());
    }

    input.addEventListener('input', sync);
    button.addEventListener('click', handleSave);
    sync();

    return () => {
      input.removeEventListener('input', sync);
      button.removeEventListener('click', handleSave);
    };
  }

  return { html, mount };
}
