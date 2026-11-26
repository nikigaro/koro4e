/** Список разделов для панели вкладок. Порядок в массиве задаёт расположение слева направо. */
export function getNavigationItems(currentUser) {
  const items = [
    {
      id: 'profile',
      label: 'Профиль',
      path: '/profile',
      icon: 'profile',
    },
    {
      id: 'rules',
      label: 'Правила',
      path: '/rules',
      icon: 'rules',
    },
    {
      id: 'feed',
      label: 'Лента',
      path: '/feed',
      icon: 'feed',
    },
    {
      id: 'chat',
      label: 'Чат',
      path: '/chat',
      icon: 'chat',
      group: '/chat',
    },
    {
      id: 'media',
      label: 'Медиа',
      path: '/media',
      icon: 'media',
    },
    {
      id: 'music',
      label: 'Музыка',
      path: '/music',
      icon: 'music',
    },
    {
      id: 'ideas',
      label: 'Идеи',
      path: '/ideas',
      icon: 'ideas',
    },
  ];

  const isAdmin = currentUser
    && (currentUser.handle === 'murs' || currentUser.username === 'murs');

  if (isAdmin) {
    items.push({
      id: 'admin',
      label: 'Админ панель',
      path: '/admin',
      icon: 'admin',
    });
  }

  return items;
}
