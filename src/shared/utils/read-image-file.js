/** Читает картинку и уменьшает её, чтобы вложение помещалось в хранилище. */
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 1000;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ type: 'image', src: canvas.toDataURL('image/jpeg', 0.82), name: file.name });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
