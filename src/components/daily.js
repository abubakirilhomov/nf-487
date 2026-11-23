import gsap from 'gsap';
import { weatherIcon, UI } from '../utils/icons.js';
import { formatWeekday, t } from '../utils/format.js';

export function renderDaily(el, { daily, tz, current, source }) {
  const weekMin = Math.min(...daily.map((d) => d.min));
  const weekMax = Math.max(...daily.map((d) => d.max));
  const span = Math.max(weekMax - weekMin, 1);
  const pct = (v) => ((v - weekMin) / span) * 100;

  const rows = daily
    .map((d, i) => {
      const left = pct(d.min);
      const width = Math.max(pct(d.max) - left, 4);
      const nowDot =
        i === 0 ? `<span class="temp-now" style="left:${pct(current.temp)}%"></span>` : '';
      return `
        ${i > 0 ? '<div class="soft-divider"></div>' : ''}
        <div class="grid grid-cols-[4.5rem_2.75rem_2.5rem_1fr_2.5rem] items-center gap-2 py-2.5">
          <span class="text-[16px] font-medium">${formatWeekday(d.dt, tz, i)}</span>
          <div class="flex flex-col items-center">
            ${weatherIcon(d.icon, 30)}
            ${d.pop >= 0.2 ? `<span class="-mt-0.5 text-[10px] font-semibold text-sky-300">${Math.round(d.pop * 100)}%</span>` : ''}
          </div>
          <span class="text-right text-[16px] opacity-60">${t(d.min)}</span>
          <div class="temp-track mx-1">
            <span class="temp-range" data-range style="left:${left}%;width:${width}%"></span>
            ${nowDot}
          </div>
          <span class="text-[16px] font-semibold">${t(d.max)}</span>
        </div>`;
    })
    .join('');

  el.innerHTML = `
    <div data-anim>
      <div class="section-title">${UI.calendar(14)} Прогноз на ${daily.length} ${daily.length > 4 ? 'дней' : 'дня'}</div>
      ${rows}
      ${
        source === 'free'
          ? '<p class="mt-2 text-[11px] opacity-50">Бесплатный тариф OpenWeather даёт прогноз на 5 дней. Для 8 дней включи One Call 3.0 в .env</p>'
          : ''
      }
    </div>`;

  gsap.from(el.querySelectorAll('[data-range]'), {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.9,
    stagger: 0.05,
    ease: 'power3.out',
    delay: 0.2,
  });
}
