function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}

/** Относительное время в простом русском формате. */
export function formatTime(timestamp) {
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${plural(minutes, 'минуту', 'минуты', 'минут')} назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${plural(hours, 'час', 'часа', 'часов')} назад`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${plural(days, 'день', 'дня', 'дней')} назад`;

  return new Date(timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}
