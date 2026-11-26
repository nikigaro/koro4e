import { escapeHtml } from '../utils/escape-html.js';

/** Модальное окно с холстом. Используется для аватара и баннера. */
export function createDrawingPad({ id, title, width, height, onSave }) {
  const html = `
    <div class="drawing-modal" data-drawing-modal="${id}" hidden>
      <div class="drawing-modal__card">
        <header class="drawing-modal__header">
          <h2>${escapeHtml(title)}</h2>
          <button class="action" type="button" data-close aria-label="Закрыть">×</button>
        </header>
        <canvas class="drawing-canvas" width="${width}" height="${height}"></canvas>
        <div class="drawing-tools">
          <label>Цвет <input type="color" value="#000000" data-color /></label>
          <label>Фон <input type="color" value="#ffffff" data-background /></label>
          <label>Толщина <input type="range" min="1" max="30" value="8" data-size /></label>
          <button class="action" type="button" data-eraser>Ластик</button>
          <button class="action" type="button" data-clear>Очистить</button>
        </div>
        <footer class="drawing-modal__footer">
          <button class="button" type="button" data-cancel>Отмена</button>
          <button class="button button--primary" type="button" data-save>Сохранить</button>
        </footer>
      </div>
    </div>
  `;

  function mount(root) {
    const modal = root.querySelector(`[data-drawing-modal="${id}"]`);
    const canvas = modal.querySelector('canvas');
    const colorInput = modal.querySelector('[data-color]');
    const backgroundInput = modal.querySelector('[data-background]');
    const sizeInput = modal.querySelector('[data-size]');
    const eraserButton = modal.querySelector('[data-eraser]');
    const context = canvas.getContext('2d');
    let isDrawing = false;
    let isEraser = false;

    function paintBackground() {
      context.fillStyle = backgroundInput.value;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function handleDown(event) {
      isDrawing = true;
      const point = getPoint(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
      canvas.setPointerCapture(event.pointerId);
    }

    function handleMove(event) {
      if (!isDrawing) return;
      context.strokeStyle = isEraser ? backgroundInput.value : colorInput.value;
      context.lineWidth = Number(sizeInput.value) * (isEraser ? 3 : 1);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      const point = getPoint(event);
      context.lineTo(point.x, point.y);
      context.stroke();
    }

    function handleUp() {
      isDrawing = false;
    }

    function clear() {
      paintBackground();
    }

    function toggleEraser() {
      isEraser = !isEraser;
      eraserButton.classList.toggle('is-active', isEraser);
    }

    function open() {
      isEraser = false;
      eraserButton.classList.remove('is-active');
      paintBackground();
      modal.hidden = false;
    }

    function close() {
      modal.hidden = true;
    }

    function save() {
      onSave(canvas.toDataURL('image/png'));
      close();
    }

    function handleKey(event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    }

    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);
    eraserButton.addEventListener('click', toggleEraser);
    backgroundInput.addEventListener('input', paintBackground);
    modal.querySelector('[data-clear]').addEventListener('click', clear);
    modal.querySelector('[data-close]').addEventListener('click', close);
    modal.querySelector('[data-cancel]').addEventListener('click', close);
    modal.querySelector('[data-save]').addEventListener('click', save);
    document.addEventListener('keydown', handleKey);

    function destroy() {
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
      eraserButton.removeEventListener('click', toggleEraser);
      backgroundInput.removeEventListener('input', paintBackground);
      modal.querySelector('[data-clear]').removeEventListener('click', clear);
      modal.querySelector('[data-close]').removeEventListener('click', close);
      modal.querySelector('[data-cancel]').removeEventListener('click', close);
      modal.querySelector('[data-save]').removeEventListener('click', save);
      document.removeEventListener('keydown', handleKey);
    }

    return { destroy, open, close };
  }

  return { html, mount };
}
