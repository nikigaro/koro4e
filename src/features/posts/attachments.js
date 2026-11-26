import { escapeHtml } from '../../shared/utils/escape-html.js';

export { readImageFile } from '../../shared/utils/read-image-file.js';

export function createLinkAttachment(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const shortName = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`;
    return { type: 'link', url: url.href, label: shortName.slice(0, 60) };
  } catch {
    return null;
  }
}

export function createDrawingAttachment(dataUrl) {
  return { type: 'image', src: dataUrl, name: 'Рисунок' };
}

export function renderAttachmentPreview(attachment, index) {
  const content = attachment.type === 'link'
    ? `<span class="attachment-preview__link">${escapeHtml(attachment.label)}</span>`
    : `<img src="${escapeHtml(attachment.src)}" alt="" />`;

  return `
    <div class="attachment-preview">
      ${content}
      <button class="attachment-preview__remove" type="button" data-remove-attachment="${index}" aria-label="Убрать вложение">×</button>
    </div>
  `;
}

export function renderAttachment(attachment) {
  if (attachment.type === 'link') {
    return `<a class="post__attachment-link" href="${escapeHtml(attachment.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(attachment.label)}</a>`;
  }
  if (attachment.type === 'image') {
    return `<img class="post__attachment-image" src="${escapeHtml(attachment.src)}" alt="${escapeHtml(attachment.name || 'Вложение')}" />`;
  }
  return '';
}
