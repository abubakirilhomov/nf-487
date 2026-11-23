// Все времена OpenWeather — UNIX (UTC). Сдвигаем на часовой пояс города
// и читаем через getUTC*, чтобы показывать местное время города, а не устройства.
const local = (dt, tz) => new Date((dt + tz) * 1000);

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});
const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' });
const fullDateFmt = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export const formatTime = (dt, tz) => timeFmt.format(local(dt, tz));
export const formatHour = (dt, tz) => String(local(dt, tz).getUTCHours()).padStart(2, '0');

export function formatWeekday(dt, tz, index) {
  if (index === 0) return 'Сегодня';
  const s = weekdayFmt.format(local(dt, tz)).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatFullDate(dt, tz) {
  const s = fullDateFmt.format(local(dt, tz));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const t = (n) => `${Math.round(n)}°`;

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const hPaToMmHg = (hpa) => Math.round(hpa * 0.750062);

export function windDirection(deg = 0) {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}

export function flag(countryCode = '') {
  if (countryCode.length !== 2) return '';
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
  );
}

export const regionName = (() => {
  try {
    const names = new Intl.DisplayNames(['ru'], { type: 'region' });
    return (code) => (code ? names.of(code) : '');
  } catch {
    return (code) => code || '';
  }
})();

export function feelsHint(temp, feels) {
  const diff = Math.round(feels - temp);
  if (Math.abs(diff) <= 1) return 'Почти как на самом деле';
  if (diff < 0) return 'Ощущается холоднее из-за ветра';
  return 'Ощущается теплее из-за влажности';
}

export function uviLabel(uvi) {
  if (uvi < 3) return 'Низкий';
  if (uvi < 6) return 'Умеренный';
  if (uvi < 8) return 'Высокий';
  if (uvi < 11) return 'Очень высокий';
  return 'Экстремальный';
}

export function debounce(fn, ms = 300) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
