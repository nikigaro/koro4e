import { createDrawingPad } from '../../shared/ui/drawing-pad.js';
import { renderAvatar } from '../../shared/ui/avatar.js';
import { escapeHtml } from '../../shared/utils/escape-html.js';
import { readImageFile } from '../../shared/utils/read-image-file.js';
import { renderUserLink } from '../../shared/utils/render-rich-text.js';
import { isCreator } from '../users/roles.js';
import { createDevicesView } from '../devices/device-view.js';
import { createAboutEditor } from './about-editor.js';

function formatAbout(text) {
  if (!text) return '';
  return `<p class="profile__about">${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;
}

/** Профиль: баннер, аватар, «О себе» и редактирование всего этого. */
export function createProfileView({ store, usersService, postsService, devicesService }) {
  const user = usersService.getCurrentUser();
  let rootNode = null;

  function applyPatch(patch) {
    const updated = usersService.updateCurrentUser(patch);
    if (updated && rootNode) syncUser(updated);
  }

  const avatarPad = createDrawingPad({
    id: 'avatar',
    title: 'Нарисовать аватар',
    width: 512,
    height: 512,
    onSave: (image) => applyPatch({ avatar: image }),
  });

  const bannerPad = createDrawingPad({
    id: 'banner',
    title: 'Нарисовать баннер',
    width: 1200,
    height: 300,
    onSave: (image) => applyPatch({ banner: image }),
  });

  const aboutEditor = createAboutEditor({
    user,
    onSave: (text) => applyPatch({ about: text }),
  });

  const devicesView = createDevicesView({ store, usersService, devicesService });

  const html = `
    <section class="profile">
      <div class="profile__banner" data-profile-banner title="Нарисовать баннер">
        ${user.banner
          ? `<img class="profile__banner-image" src="${escapeHtml(user.banner)}" alt="Баннер профиля" />`
          : '<span class="profile__banner-empty">Нарисуй баннер</span>'}
      </div>

      <header class="profile__card">
        <div class="profile__avatar" data-profile-avatar title="Нарисовать аватар">${renderAvatar(user, 'large')}</div>
        <div class="profile__info">
          <h1 class="profile__name">${renderUserLink(user, isCreator(user) ? 'user-link profile__creator-link' : 'user-link')}${isCreator(user) ? '<span class="role-badge">Создатель</span>' : ''}</h1>
          <div data-profile-about>${formatAbout(user.about)}</div>
          ${aboutEditor.html}
        </div>
      </header>

      <div class="profile__stats">
        <div class="profile__stat">
          <strong data-profile-posts>0</strong>
          <span>постов</span>
        </div>
        <div class="profile__stat">
          <strong>${postsService.listByAuthor(user.id).reduce((total, post) => total + post.likes, 0)}</strong>
          <span>хайпа получено</span>
        </div>
      </div>

      ${devicesView.html}

      ${avatarPad.html}
      ${bannerPad.html}

      <div class="drawing-modal avatar-choice" data-avatar-choice hidden>
        <div class="drawing-modal__card avatar-choice__card" role="dialog" aria-modal="true" aria-labelledby="avatar-choice-title">
          <header class="drawing-modal__header">
            <h2 id="avatar-choice-title">Аватар</h2>
            <button class="action" type="button" data-avatar-close aria-label="Закрыть">×</button>
          </header>
          <p class="avatar-choice__text">Загрузи картинку с компьютера или нарисуй сам.</p>
          <div class="avatar-choice__actions">
            <button class="button" type="button" data-avatar-upload>Загрузить фото</button>
            <button class="button button--primary" type="button" data-avatar-draw>Нарисовать</button>
          </div>
          <input type="file" accept="image/*" hidden data-avatar-input />
        </div>
      </div>
    </section>
  `;

  function syncUser(nextUser) {
    rootNode.querySelector('[data-profile-avatar]').innerHTML = renderAvatar(nextUser, 'large');

    rootNode.querySelector('[data-profile-banner]').innerHTML = nextUser.banner
      ? `<img class="profile__banner-image" src="${escapeHtml(nextUser.banner)}" alt="Баннер профиля" />`
      : '<span class="profile__banner-empty">Нарисуй баннер</span>';

    rootNode.querySelector('[data-profile-about]').innerHTML = formatAbout(nextUser.about);
  }

  function mount(root) {
    rootNode = root;
    const avatarPadControls = avatarPad.mount(root);
    const bannerPadControls = bannerPad.mount(root);
    const cleanupAbout = aboutEditor.mount(root);
    const cleanupDevices = devicesView.mount(root);
    const postsCount = root.querySelector('[data-profile-posts]');
    const avatarChoice = root.querySelector('[data-avatar-choice]');
    const avatarInput = root.querySelector('[data-avatar-input]');

    function renderCount() {
      postsCount.textContent = String(postsService.listByAuthor(user.id).length);
    }

    function openAvatarChoice() {
      avatarChoice.hidden = false;
    }

    function closeAvatarChoice() {
      avatarChoice.hidden = true;
    }

    function handleClick(event) {
      if (event.target.closest('[data-profile-avatar]')) openAvatarChoice();
      if (event.target.closest('[data-profile-banner]')) bannerPadControls.open();
      if (event.target.closest('[data-avatar-close]')) closeAvatarChoice();
      if (event.target.closest('[data-avatar-upload]')) avatarInput.click();
      if (event.target.closest('[data-avatar-draw]')) {
        closeAvatarChoice();
        avatarPadControls.open();
      }
      if (event.target === avatarChoice) closeAvatarChoice();
    }

    async function handleAvatarFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const image = await readImageFile(file);
        applyPatch({ avatar: image.src });
        closeAvatarChoice();
      } catch {
        // Картинку не удалось прочитать, оставляем прежний аватар.
      }
      avatarInput.value = '';
    }

    function handleKey(event) {
      if (event.key === 'Escape' && !avatarChoice.hidden) closeAvatarChoice();
    }

    renderCount();
    root.addEventListener('click', handleClick);
    avatarInput.addEventListener('change', handleAvatarFile);
    document.addEventListener('keydown', handleKey);
    const unsubscribe = store.subscribe(renderCount);

    return () => {
      unsubscribe();
      root.removeEventListener('click', handleClick);
      avatarInput.removeEventListener('change', handleAvatarFile);
      document.removeEventListener('keydown', handleKey);
      avatarPadControls.destroy();
      bannerPadControls.destroy();
      cleanupAbout();
      cleanupDevices();
      rootNode = null;
    };
  }

  return { html, mount };
}
