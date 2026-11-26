import { createStore } from '../core/store.js';
import { loadState, saveState } from '../core/persistence.js';
import { loadRemoteState, saveRemoteState, mergeStates } from '../core/supabase-state.js';
import { createRouter } from '../core/router.js';
import { initTheme } from '../shared/theme.js';
import { createAppHeader } from '../layout/app-header.js';
import { createTabBar } from '../layout/tab-bar.js';
import { getNavigationItems } from '../layout/navigation.js';
import { createUsersService } from '../features/users/users-service.js';
import { createPostsService } from '../features/posts/posts-service.js';
import { createFeedView } from '../features/posts/feed-view.js';
import { createWallView } from '../features/wall/wall-view.js';
import { createProfileView } from '../features/profile/profile-view.js';
import { createInfoView } from '../features/info/info-view.js';
import { createMediaService } from '../features/media/media-service.js';
import { createMediaView } from '../features/media/media-view.js';
import { createMusicService } from '../features/music/music-service.js';
import { createMusicView } from '../features/music/music-view.js';
import { createChatService } from '../features/chat/chat-service.js';
import { createChatView } from '../features/chat/chat-view.js';
import { createChatThreadView } from '../features/chat/chat-thread-view.js';
import { createDevicesService } from '../features/devices/device-service.js';
import { createDevicePendingView } from '../features/devices/device-pending-view.js';
import { createAuthService } from '../features/auth/auth-service.js';
import { createAuthView } from '../features/auth/auth-view.js';

// 1. Инфраструктура
initTheme();
const localState = loadState();
let remoteState = null;
try {
  remoteState = await loadRemoteState();
} catch (error) {
  console.warn('Supabase недоступен, работаем локально:', error);
}
const initialState = mergeStates(localState, remoteState);
const store = createStore(initialState);
saveState(store.getState());

// Изменения состояния отправляются в Supabase с небольшой задержкой.
let remoteSaveTimer = null;
store.subscribe(() => {
  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(async () => {
    try {
      await saveRemoteState(store.getState());
    } catch (error) {
      console.warn('Не удалось сохранить в Supabase:', error);
    }
  }, 600);
});

if (!remoteState || Object.keys(remoteState).length === 0) {
  saveRemoteState(store.getState()).catch((error) => {
    console.warn('Не удалось записать начальное состояние в Supabase:', error);
  });
}

// 2. Сервисы (бизнес-логика)
const usersService = createUsersService(store);
const postsService = createPostsService({ store, usersService });
const authService = createAuthService({ store, usersService });
const mediaService = createMediaService({ store, usersService });
const musicService = createMusicService({ store, usersService });
const chatService = createChatService({ store, usersService });
const devicesService = createDevicesService({ store, usersService });

function ensureCurrentDevice() {
  const user = usersService.getCurrentUser();
  if (user) devicesService.ensureDevice(user.id);
}

async function checkDeviceAgain() {
  try {
    const remote = await loadRemoteState();
    if (remote) store.setState(mergeStates(store.getState(), remote));
  } catch (error) {
    console.warn('Не удалось проверить устройство:', error);
  }
}

// 3. Каркас страницы
const app = document.querySelector('#app');
let viewRoot;
let cleanupShell = null;

function renderShell() {
  if (cleanupShell) cleanupShell();

  const currentUser = usersService.getCurrentUser();
  const header = currentUser
    ? createAppHeader({ store, usersService, onLogout: handleLogout })
    : null;
  const tabBar = currentUser ? createTabBar(getNavigationItems(currentUser)) : null;

  app.innerHTML = `
    <div class="app-shell ${tabBar ? 'has-bottom-tabs' : ''}">
      ${header ? header.html : ''}
      <main class="app-main" id="view-root"></main>
      <footer class="app-footer">Вайбкодить соц сети не так уж легко!</footer>
    </div>
    ${tabBar ? `<div class="bottom-tabs">${tabBar.html}</div>` : ''}
  `;

  const cleanups = [];
  if (header) cleanups.push(header.mount(app));
  if (tabBar) cleanups.push(tabBar.mount(app));
  cleanupShell = () => cleanups.forEach((cleanup) => cleanup());

  viewRoot = app.querySelector('#view-root');
}

async function handleAuthenticated() {
  await chatService.hydrate();
  ensureCurrentDevice();
  renderShell();
  router.navigate('/feed');
}

function handleLogout() {
  authService.logout();
  chatService.clearCache();
  renderShell();
  router.navigate('/login');
}

// 4. Маршруты
const router = createRouter({
  routes: {
    '/feed': () => createFeedView({ store, usersService, postsService }),
    '/profile': () => createProfileView({ store, usersService, postsService, devicesService }),
    '/rules': () => createInfoView({ page: 'rules' }),
    '/media': () => createMediaView({ store, mediaService }),
    '/ideas': () => createInfoView({ page: 'ideas' }),
    '/music': () => createMusicView({ store, musicService }),
    '/chat': () => createChatView({ store, usersService, chatService }),
    '/chat/:userId': ({ userId }) => createChatThreadView({
      store, usersService, chatService, userId,
    }),
    '/admin': () => createInfoView({ page: 'admin' }),
    '/wall/:userId': ({ userId }) => createWallView({ store, usersService, postsService, userId }),
    '/register': () => createAuthView({
      mode: 'register', authService, onAuthenticated: handleAuthenticated,
    }),
    '/login': () => createAuthView({
      mode: 'login', authService, onAuthenticated: handleAuthenticated,
    }),
  },
  fallback: '/feed',
  render(view, path) {
    const currentUser = usersService.getCurrentUser();
    const isAuthenticated = Boolean(currentUser);
    const isAuthRoute = path === '/register' || path === '/login';

    if (!isAuthenticated && !isAuthRoute) {
      router.navigate('/register');
      return null;
    }
    if (isAuthenticated && isAuthRoute) {
      router.navigate('/feed');
      return null;
    }

    if (isAuthenticated && !devicesService.isAllowed(currentUser.id)) {
      const pending = createDevicePendingView({
        usersService,
        devicesService,
        onRetry: checkDeviceAgain,
      });
      viewRoot.innerHTML = pending.html;
      return pending.mount(viewRoot);
    }

    const isAdminRoute = path === '/admin';
    const isAdmin = currentUser
      && (currentUser.handle === 'murs' || currentUser.username === 'murs');
    if (isAdminRoute && !isAdmin) {
      router.navigate('/feed');
      return null;
    }

    viewRoot.innerHTML = view.html;
    return view.mount(viewRoot);
  },
});

await chatService.hydrate();
ensureCurrentDevice();
renderShell();
router.start();
