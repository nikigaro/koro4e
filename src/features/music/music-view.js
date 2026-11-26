import { escapeHtml } from '../../shared/utils/escape-html.js';
import { createUploadDialog } from '../../shared/ui/upload-dialog.js';

function renderTrack(track, index) {
  const likes = track.likes ?? 0;
  const cover = track.cover
    ? `<img class="track__cover" src="${escapeHtml(track.cover)}" alt="" />`
    : '<span class="track__cover track__cover--empty">♪</span>';

  return `
    <div class="track" data-play-track="${escapeHtml(track.id)}">
      <span class="track__index">${index + 1}</span>
      ${cover}
      <button class="track__play" type="button" aria-label="Слушать">▶</button>
      <div class="track__info">
        <strong class="track__title">${escapeHtml(track.title)}</strong>
        <span class="track__artist">${escapeHtml(track.artist)}</span>
      </div>
      <button class="card-like ${track.likedByMe ? 'is-liked' : ''}" type="button" data-like-track="${escapeHtml(track.id)}" aria-label="ХАЙП" title="ХАЙП">
        <img class="card-like__icon" src="assets/icons/xd-hype.png" alt="" aria-hidden="true" />
        ${likes}
      </button>
      <button class="track__remove" type="button" data-remove-track="${escapeHtml(track.id)}" aria-label="Удалить">×</button>
    </div>
  `;
}

/** Раздел «Музыка» со списком треков и плеером, как в вк. */
export function createMusicView({ store, musicService }) {
  let pendingFiles = [];
  let uploadControls = null;

  const uploadDialog = createUploadDialog({
    id: 'music',
    title: 'Загрузить трек',
    onSubmit: (data) => {
      musicService.add(data).finally(() => setTimeout(showNext, 0));
    },
  });

  function showNext() {
    const nextFile = pendingFiles.shift();
    if (nextFile && uploadControls) {
      uploadControls.open(nextFile, nextFile.name, { type: 'audio' });
    }
  }

  const html = `
    <section class="upload-page music-page">
      <header class="upload-page__header">
        <div>
          <h1 class="info-page__title">Музыка</h1>
          <p class="info-page__intro">Свои треки и плейлист, как в вк. Загружай и слушай.</p>
        </div>
        <label class="button button--primary">
          Загрузить
          <input type="file" accept="audio/*" multiple hidden data-audio-input />
        </label>
      </header>
      <div class="track-list" data-track-list></div>
      <div class="music-player" data-player hidden>
        <div class="music-player__cover" data-player-cover></div>
        <div class="music-player__info">
          <strong data-player-title></strong>
          <span data-player-artist></span>
        </div>
        <audio data-audio controls></audio>
      </div>
      ${uploadDialog.html}
    </section>
  `;

  function mount(root) {
    uploadControls = uploadDialog.mount(root);
    const list = root.querySelector('[data-track-list]');
    const input = root.querySelector('[data-audio-input]');
    const player = root.querySelector('[data-player]');
    const playerCover = player.querySelector('[data-player-cover]');
    const playerTitle = player.querySelector('[data-player-title]');
    const playerArtist = player.querySelector('[data-player-artist]');
    const audio = player.querySelector('[data-audio]');

    function render() {
      const tracks = musicService.list();
      list.innerHTML = tracks.length
        ? tracks.map(renderTrack).join('')
        : '<div class="empty">Пока нет треков. Загрузи первый.</div>';
    }

    function playTrack(id) {
      const track = musicService.list().find((item) => item.id === id);
      if (!track) return;
      playerTitle.textContent = track.title;
      playerArtist.textContent = track.artist;
      playerCover.innerHTML = track.cover
        ? `<img src="${escapeHtml(track.cover)}" alt="" />`
        : '<span>♪</span>';
      audio.src = track.src;
      player.hidden = false;
      audio.play().catch(() => {});
    }

    function handleClick(event) {
      const like = event.target.closest('[data-like-track]');
      if (like) {
        musicService.toggleLike(like.dataset.likeTrack);
        return;
      }
      const remove = event.target.closest('[data-remove-track]');
      if (remove) {
        const wasCurrent = remove.dataset.removeTrack
          === root.querySelector('.track.is-current')?.dataset.playTrack;
        musicService.remove(remove.dataset.removeTrack);
        if (wasCurrent) {
          player.hidden = true;
          audio.pause();
        }
        return;
      }
      const row = event.target.closest('[data-play-track]');
      if (!row) return;
      root.querySelectorAll('.track').forEach((item) => item.classList.remove('is-current'));
      row.classList.add('is-current');
      playTrack(row.dataset.playTrack);
    }

    function handleInput(event) {
      pendingFiles = Array.from(event.target.files ?? []);
      input.value = '';
      showNext();
    }

    render();
    root.addEventListener('click', handleClick);
    input.addEventListener('change', handleInput);
    const unsubscribe = store.subscribe(render);

    return () => {
      unsubscribe();
      audio.pause();
      root.removeEventListener('click', handleClick);
      input.removeEventListener('change', handleInput);
      uploadControls.destroy();
      uploadControls = null;
    };
  }

  return { html, mount };
}
