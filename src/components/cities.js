import Swiper from 'swiper';
import { FreeMode, Mousewheel } from 'swiper/modules';
import { getCurrent } from '../api/weather.js';
import { storage } from '../services/storage.js';
import { weatherIcon, UI } from '../utils/icons.js';
import { escapeHtml, flag, formatTime, t } from '../utils/format.js';

let swiper;
const cache = new Map(); // кэш текущей погоды по городам (5 минут)

async function current(city) {
  const key = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.data;
  const data = await getCurrent(city.lat, city.lon);
  cache.set(key, { at: Date.now(), data });
  return data;
}

export function renderCities(el, { onSelect, onAdd }) {
  const saved = storage.getSaved();

  const slides = saved
    .map(
      (c, i) => `
      <div class="swiper-slide">
        <div data-city="${i}" role="button" tabindex="0"
          class="glass relative flex h-36 w-40 cursor-pointer flex-col p-3.5 transition-transform active:scale-95">
          <button data-remove="${i}" class="absolute top-2 right-2 grid size-7 place-items-center rounded-full opacity-50 hover:opacity-100" aria-label="Удалить">${UI.close(14)}</button>
          <div class="truncate pr-5 text-[15px] font-semibold">${flag(c.country)} ${escapeHtml(c.name)}</div>
          <div class="text-[11px] opacity-60" data-time>&nbsp;</div>
          <div class="mt-auto flex items-end justify-between">
            <span class="text-3xl font-light" data-temp><span class="animate-pulse inline-block h-7 w-12 rounded-lg bg-white/15"></span></span>
            <span data-icon></span>
          </div>
        </div>
      </div>`,
    )
    .join('');

  el.innerHTML = `
    <div data-anim>
      <div class="section-title px-1">${UI.star(14)} Мои города</div>
      <div class="swiper cities-swiper !overflow-visible">
        <div class="swiper-wrapper">
          ${slides}
          <div class="swiper-slide">
            <button data-add class="glass flex h-36 w-28 flex-col items-center justify-center gap-2 text-sm opacity-90 transition-transform active:scale-95">
              <span class="grid size-10 place-items-center rounded-full bg-white/15">${UI.plus(20)}</span>
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>`;

  swiper?.destroy(true, true);
  swiper = new Swiper(el.querySelector('.cities-swiper'), {
    modules: [FreeMode, Mousewheel],
    slidesPerView: 'auto',
    spaceBetween: 10,
    freeMode: true,
    mousewheel: { forceToAxis: true },
    grabCursor: true,
  });

  el.querySelector('[data-add]').addEventListener('click', onAdd);
  el.querySelectorAll('[data-city]').forEach((card) => {
    const city = saved[Number(card.dataset.city)];
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-remove]')) {
        storage.removeSaved(city);
        renderCities(el, { onSelect, onAdd });
        return;
      }
      onSelect(city);
    });

    current(city)
      .then((w) => {
        card.querySelector('[data-temp]').textContent = t(w.temp);
        card.querySelector('[data-icon]').innerHTML = weatherIcon(w.icon, 40);
        card.querySelector('[data-time]').textContent =
          formatTime(Math.floor(Date.now() / 1000), w.tz);
      })
      .catch(() => {
        card.querySelector('[data-temp]').textContent = '—';
      });
  });
}
