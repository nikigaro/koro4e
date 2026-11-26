const STORAGE_KEY = 'koroche.theme';

/** Тема по умолчанию светлая. Выбор сохраняется рядом с состоянием приложения. */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light';
}

export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function toggleTheme() {
  const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(STORAGE_KEY, nextTheme);
  return nextTheme;
}
