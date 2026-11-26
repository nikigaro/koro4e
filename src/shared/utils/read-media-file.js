const PERSISTENT_LIMIT = 3 * 1024 * 1024;

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Маленькие файлы сохраняются надолго, большие живут до перезагрузки через blob URL. */
export async function readMediaFile(file) {
  if (file.size <= PERSISTENT_LIMIT) {
    return { src: await readAsDataURL(file), persistent: true };
  }
  return { src: URL.createObjectURL(file), persistent: false };
}

/** Пробует сделать превью по первому кадру видео. */
export function createVideoThumbnail(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    let finished = false;

    function done(result) {
      if (finished) return;
      finished = true;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    }

    video.muted = true;
    video.preload = 'metadata';
    video.onerror = () => done(null);
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      } catch {
        done(null);
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / (video.videoWidth || 480));
        canvas.width = Math.max(1, Math.round((video.videoWidth || 480) * scale));
        canvas.height = Math.max(1, Math.round((video.videoHeight || 270) * scale));
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        done(null);
      }
    };
    video.src = objectUrl;
  });
}
