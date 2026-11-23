/* ---------- Анимированные иконки погоды (SVG, градиенты в index.html) ---------- */

const rays = (cx, cy, r1, r2) => {
  let lines = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    lines += `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}"/>`;
  }
  return `<g class="wx-rays" stroke="#FFD35C" stroke-width="3" stroke-linecap="round">${lines}</g>`;
};

const sun = (cx = 32, cy = 32, r = 12) =>
  `${rays(cx, cy, r + 5, r + 10)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g-sun)"/>`;

const moon = (s = 1, x = 0, y = 0) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M40 12a20 20 0 1 0 14 34A17 17 0 0 1 40 12z" fill="url(#g-moon)"/></g>`;

const cloud = (dark = false, dy = 0) =>
  `<g class="wx-float" transform="translate(0 ${dy})" fill="url(#${dark ? 'g-cloud-dark' : 'g-cloud'})">
    <circle cx="24" cy="36" r="10"/><circle cx="36" cy="29" r="13"/><circle cx="47" cy="38" r="8"/>
    <rect x="14" y="36" width="41" height="10" rx="5"/>
  </g>`;

const drops = `<g stroke="#7CC8FF" stroke-width="3" stroke-linecap="round">
  <line class="wx-drop" x1="24" y1="46" x2="22" y2="52"/>
  <line class="wx-drop" x1="34" y1="46" x2="32" y2="52"/>
  <line class="wx-drop" x1="44" y1="46" x2="42" y2="52"/></g>`;

const flakes = `<g fill="#FFFFFF">
  <circle class="wx-flake" cx="24" cy="48" r="2.4"/>
  <circle class="wx-flake" cx="34" cy="50" r="2.4"/>
  <circle class="wx-flake" cx="44" cy="48" r="2.4"/></g>`;

const bolt = `<path class="wx-bolt" d="M35 40l-8 12h6l-3 9 10-13h-6l3-8z" fill="url(#g-bolt)"/>`;

const fog = `<g stroke="#E8EEF5" stroke-width="3.5" stroke-linecap="round" opacity=".9">
  <line class="wx-fog" x1="12" y1="26" x2="46" y2="26"/>
  <line class="wx-fog" x1="18" y1="35" x2="52" y2="35"/>
  <line class="wx-fog" x1="12" y1="44" x2="42" y2="44"/></g>`;

const ICONS = {
  'clear-d': () => sun(),
  'clear-n': () => moon(1, -4, 0),
  'partly-d': () => `${sun(24, 24, 9)}${cloud(false, 4)}`,
  'partly-n': () => `${moon(0.65, 2, -2)}${cloud(false, 4)}`,
  clouds: () => `<g opacity=".55" transform="translate(-8 -8) scale(.8)">${cloud()}</g>${cloud(false, 2)}`,
  rain: () => `${cloud(false, -6)}${drops}`,
  thunder: () => `${cloud(true, -8)}${bolt}`,
  snow: () => `${cloud(false, -6)}${flakes}`,
  mist: () => fog,
};

/** OpenWeather icon code (например "10d") → ключ иконки */
export function iconKey(code = '01d') {
  const n = code.slice(0, 2);
  const isDay = code.endsWith('d');
  switch (n) {
    case '01':
      return isDay ? 'clear-d' : 'clear-n';
    case '02':
      return isDay ? 'partly-d' : 'partly-n';
    case '03':
    case '04':
      return 'clouds';
    case '09':
    case '10':
      return 'rain';
    case '11':
      return 'thunder';
    case '13':
      return 'snow';
    case '50':
      return 'mist';
    default:
      return 'clouds';
  }
}

export function weatherIcon(code, size = 40, extraClass = '') {
  const key = iconKey(code);
  return `<svg class="wx-icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${ICONS[key]()}</svg>`;
}

/* ---------- UI-иконки (линейные, 24×24) ---------- */
const ui = (path, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

export const UI = {
  search: (s) => ui('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', s),
  pin: (s) => ui('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', s),
  nav: (s) => ui('<path d="M3 11 21 3l-8 18-2-8-8-2z"/>', s),
  star: (s) => ui('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z"/>', s),
  close: (s) => ui('<path d="M18 6 6 18M6 6l12 12"/>', s),
  plus: (s) => ui('<path d="M12 5v14M5 12h14"/>', s),
  clock: (s) => ui('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s),
  calendar: (s) => ui('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>', s),
  thermo: (s) => ui('<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>', s),
  drop: (s) => ui('<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>', s),
  wind: (s) => ui('<path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h7"/>', s),
  gauge: (s) => ui('<path d="M12 14l4-4"/><path d="M3.3 17a10 10 0 1 1 17.4 0"/>', s),
  eye: (s) => ui('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', s),
  cloud: (s) => ui('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>', s),
  sunrise: (s) => ui('<path d="M12 3v5M5 10l1.5 1.5M19 10l-1.5 1.5M3 18h18M7 18a5 5 0 0 1 10 0"/>', s),
  uv: (s) => ui('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', s),
  umbrella: (s) => ui('<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2 2 0 0 0 4 0"/>', s),
  download: (s) => ui('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', s),
  share: (s) => ui('<path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>', s),
  refresh: (s) => ui('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', s),
};
