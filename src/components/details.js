import { UI } from '../utils/icons.js';
import {
  feelsHint,
  formatTime,
  hPaToMmHg,
  t,
  uviLabel,
  windDirection,
} from '../utils/format.js';

const card = (icon, title, body, extra = '') => `
  <div class="glass-card flex min-h-[9.5rem] flex-col ${extra}" data-anim>
    <div class="section-title !mb-2">${icon} ${title}</div>
    ${body}
  </div>`;

function sunArc(c) {
  const total = c.sunset - c.sunrise;
  const p = Math.min(Math.max((c.dt - c.sunrise) / total, 0), 1);
  const isDay = c.dt >= c.sunrise && c.dt <= c.sunset;
  // точка на полуокружности
  const angle = Math.PI * (1 - p);
  const x = 50 + Math.cos(angle) * 40;
  const y = 46 - Math.sin(angle) * 34;
  return `
    <svg viewBox="0 0 100 52" class="mt-auto w-full">
      <path d="M10 46 A40 34 0 0 1 90 46" fill="none" stroke="rgb(255 255 255 / .25)" stroke-width="2" stroke-dasharray="3 4"/>
      <line x1="4" y1="46" x2="96" y2="46" stroke="rgb(255 255 255 / .2)" stroke-width="1"/>
      ${isDay ? `<circle cx="${x}" cy="${y}" r="5" fill="#FFD35C"/><circle cx="${x}" cy="${y}" r="10" fill="#FFD35C" opacity=".25"/>` : ''}
    </svg>`;
}

function compass(deg = 0) {
  return `
    <div class="relative mx-auto mt-auto grid size-20 place-items-center rounded-full border border-white/20">
      <span class="absolute top-1 text-[9px] font-bold opacity-70">С</span>
      <span class="absolute bottom-1 text-[9px] font-bold opacity-50">Ю</span>
      <span class="absolute left-1.5 text-[9px] font-bold opacity-50">З</span>
      <span class="absolute right-1.5 text-[9px] font-bold opacity-50">В</span>
      <svg width="36" height="36" viewBox="0 0 24 24" style="transform:rotate(${deg + 180}deg)">
        <path d="M12 2 16 14h-8z" fill="var(--accent)"/>
        <path d="M12 22 8 14h8z" fill="rgb(255 255 255 / .35)"/>
      </svg>
    </div>`;
}

function bar(value, max = 100) {
  return `<div class="temp-track mt-auto"><span class="temp-range" style="left:0;width:${Math.min((value / max) * 100, 100)}%"></span></div>`;
}

export function renderDetails(el, { current: c, tz }) {
  const isDay = c.dt >= c.sunrise && c.dt <= c.sunset;
  const nextSun = isDay
    ? { label: 'Закат', time: c.sunset, other: `Восход: ${formatTime(c.sunrise, tz)}` }
    : { label: 'Восход', time: c.sunrise, other: `Закат: ${formatTime(c.sunset, tz)}` };

  const cards = [
    card(
      UI.thermo(14),
      'Ощущается',
      `<div class="text-4xl font-light">${t(c.feels)}</div>
       <p class="mt-auto text-[13px] opacity-75">${feelsHint(c.temp, c.feels)}</p>`,
    ),
    card(
      UI.drop(14),
      'Влажность',
      `<div class="text-4xl font-light">${c.humidity}%</div>
       ${c.dewPoint != null ? `<p class="mt-1 text-[13px] opacity-75">Точка росы ${t(c.dewPoint)}</p>` : ''}
       ${bar(c.humidity)}`,
    ),
    card(
      UI.wind(14),
      'Ветер',
      `<div class="flex items-baseline gap-1"><span class="text-4xl font-light">${Math.round(c.windSpeed)}</span><span class="text-sm opacity-75">м/с ${windDirection(c.windDeg)}</span></div>
       ${c.windGust ? `<p class="text-[13px] opacity-75">Порывы до ${Math.round(c.windGust)} м/с</p>` : ''}
       ${compass(c.windDeg)}`,
    ),
    card(
      UI.gauge(14),
      'Давление',
      `<div class="flex items-baseline gap-1"><span class="text-4xl font-light">${hPaToMmHg(c.pressure)}</span><span class="text-sm opacity-75">мм рт. ст.</span></div>
       <p class="mt-auto text-[13px] opacity-75">${c.pressure} гПа · ${hPaToMmHg(c.pressure) < 750 ? 'пониженное' : hPaToMmHg(c.pressure) > 765 ? 'повышенное' : 'нормальное'}</p>`,
    ),
    card(
      UI.sunrise(14),
      nextSun.label,
      `<div class="text-3xl font-light">${formatTime(nextSun.time, tz)}</div>
       <p class="text-[13px] opacity-75">${nextSun.other}</p>
       ${sunArc(c)}`,
    ),
    c.uvi != null
      ? card(
          UI.uv(14),
          'УФ-индекс',
          `<div class="text-4xl font-light">${Math.round(c.uvi)}</div>
           <p class="text-[13px] opacity-75">${uviLabel(c.uvi)}</p>
           ${bar(c.uvi, 11)}`,
        )
      : card(
          UI.umbrella(14),
          'Осадки',
          `<div class="text-4xl font-light">${Math.round((c.pop ?? 0) * 100)}%</div>
           <p class="mt-auto text-[13px] opacity-75">Вероятность сегодня</p>`,
        ),
    card(
      UI.eye(14),
      'Видимость',
      `<div class="flex items-baseline gap-1"><span class="text-4xl font-light">${(c.visibility / 1000).toFixed(c.visibility < 10000 ? 1 : 0)}</span><span class="text-sm opacity-75">км</span></div>
       <p class="mt-auto text-[13px] opacity-75">${c.visibility >= 10000 ? 'Отличная видимость' : c.visibility >= 4000 ? 'Хорошая видимость' : 'Плохая видимость'}</p>`,
    ),
    card(
      UI.cloud(14),
      'Облачность',
      `<div class="text-4xl font-light">${c.clouds}%</div>
       ${bar(c.clouds)}`,
    ),
  ];

  el.innerHTML = cards.join('');
}
