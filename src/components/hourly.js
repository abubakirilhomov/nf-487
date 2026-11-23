import Swiper from 'swiper';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

import { weatherIcon, UI } from '../utils/icons.js';
import { formatHour, formatTime, t } from '../utils/format.js';

let swiper;

/** Вставляет в почасовой ряд отметки восхода и заката */
function withSunEvents(hourly, data) {
  const { current, daily } = data;
  const start = hourly[0].dt;
  const end = hourly[hourly.length - 1].dt;
  const events = [];
  const add = (dt, type) => dt > start && dt < end && events.push({ dt, type });

  add(current.sunrise, 'sunrise');
  add(current.sunset, 'sunset');
  const tomorrow = daily[1];
  add(tomorrow?.sunrise ?? current.sunrise + 86400, 'sunrise');
  add(tomorrow?.sunset ?? current.sunset + 86400, 'sunset');

  return [...hourly, ...events].sort((a, b) => a.dt - b.dt);
}

export function renderHourly(el, data) {
  const { hourly, tz, current } = data;
  const step = data.source === 'free' ? 'каждые 3 часа' : 'по часам';
  const items = withSunEvents(hourly, data);

  const slides = items
    .map((h, i) => {
      if (h.type) {
        const isRise = h.type === 'sunrise';
        return `
          <div class="swiper-slide">
            <div class="flex w-14 flex-col items-center gap-2 py-1 text-center">
              <span class="text-[13px] font-medium opacity-80">${formatTime(h.dt, tz)}</span>
              <span class="grid h-10 place-items-center text-[#FFD35C]">${UI.sunrise(26)}</span>
              <span class="text-[13px] font-semibold">${isRise ? 'Восход' : 'Закат'}</span>
            </div>
          </div>`;
      }
      const isNow = i === 0;
      return `
        <div class="swiper-slide">
          <div class="flex w-14 flex-col items-center gap-2 rounded-2xl py-1 text-center ${isNow ? 'bg-white/12' : ''}">
            <span class="text-[13px] font-semibold ${isNow ? '' : 'opacity-80'}">${isNow ? 'Сейчас' : formatHour(h.dt, tz)}</span>
            <div class="flex h-10 flex-col items-center justify-center">
              ${weatherIcon(h.icon, 34)}
              ${h.pop >= 0.2 ? `<span class="-mt-0.5 text-[10px] font-semibold text-sky-300">${Math.round(h.pop * 100)}%</span>` : ''}
            </div>
            <span class="text-[17px] font-semibold">${t(h.temp)}</span>
          </div>
        </div>`;
    })
    .join('');

  el.innerHTML = `
    <div data-anim>
      <div class="section-title">${UI.clock(14)} Прогноз ${step}</div>
      <p class="mb-3 text-sm opacity-85">${hintText(current)}</p>
      <div class="soft-divider mb-3"></div>
      <div class="swiper hourly-swiper -mx-1 px-1">
        <div class="swiper-wrapper">${slides}</div>
      </div>
    </div>`;

  swiper?.destroy(true, true);
  swiper = new Swiper(el.querySelector('.hourly-swiper'), {
    modules: [FreeMode, Mousewheel],
    slidesPerView: 'auto',
    spaceBetween: 6,
    freeMode: { enabled: true, momentumRatio: 0.6 },
    mousewheel: { forceToAxis: true },
    grabCursor: true,
  });
}

function hintText(c) {
  if (c.windGust && c.windGust > 12) return `Порывы ветра до ${Math.round(c.windGust)} м/с.`;
  if (c.pop >= 0.5) return `Вероятность осадков сегодня — ${Math.round(c.pop * 100)}%. Возьми зонт.`;
  return `Сегодня от ${t(c.min)} до ${t(c.max)}, ${c.description}.`;
}
