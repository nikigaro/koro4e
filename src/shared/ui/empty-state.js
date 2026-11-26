import { escapeHtml } from '../utils/escape-html.js';

/** Пустое состояние для ленты и стены. */
export function renderEmptyState(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}
