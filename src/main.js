import './style.css';
import gsap from 'gsap';

import { getWeather, reverseGeocode } from './api/weather.js';
import { getPosition } from './services/geolocation.js';
import { storage } from './services/storage.js';
import { initServiceWorker } from './services/pwa.js';
import { DEFAULT_LOCATION } from './config.js';

import { initBackground, applyTheme } from './theme/background.js';
import { themeKey } from './theme/themes.js';

import { renderHero } from './components/hero.js';
import { renderHourly } from './components/hourly.js';
import { renderDaily } from './components/daily.js';
import { renderDetails } from './components/details.js';
import { renderCities } from './components/cities.js';
import { initSearch, openSearch } from './components/search.js';
import { initInstallPrompt } from './components/installPrompt.js';
import { toast } from './components/toast.js';

import { UI } from './utils/icons.js';
import { escapeHtml, flag, formatFullDate } from './utils/format.js';

/* ---------------- Каркас приложения ---------------- */
const app = document.getElementById('app');
app.innerHTML = `
  <div class="mx-auto max-w-6xl px-4 pb-32 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
    <header class="sticky top-0 z-30 flex items-center justify-between gap-3 py-3">
      <button id="btn-locate" class="glass-btn" aria-label="Моё местоположение">${UI.nav(18)}</button>
      <div class="min-w-0 text-center">
        <div id="loc-name" class="truncate text-lg font-semibold">
          <span class="animate-pulse inline-block h-5 w-32 rounded-lg bg-white/15"></span>
        </div>
        <div id="loc-sub" class="truncate text-xs opacity-70">&nbsp;</div>
      </div>
      <button id="btn-search" class="glass-btn" aria-label="Поиск города">${UI.search(18)}</button>
    </header>

    <main class="grid gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
      <section class="flex min-w-0 flex-col gap-4">
        <div id="hero">${heroSkeleton()}</div>
        <div id="hourly" class="glass-card"><div class="animate-pulse h-36 rounded-2xl bg-white/10"></div></div>
        <div id="cities"></div>
      </section>
      <section class="flex min-w-0 flex-col gap-4">
        <div id="daily" class="glass-card"><div class="animate-pulse h-80 rounded-2xl bg-white/10"></div></div>
        <div id="details" class="grid grid-cols-2 gap-3 sm:gap-4"></div>
      </section>
    </main>

    <footer class="mt-8 text-center text-[11px] opacity-50">
      Данные: OpenWeather · ${new Date().getFullYear()}
    </footer>
  </div>`;

function heroSkeleton() {
  return `<div class="flex flex-col items-center gap-4 py-10">
    <div class="animate-pulse size-32 rounded-full bg-white/15"></div>
    <div class="animate-pulse h-24 w-40 rounded-3xl bg-white/15"></div>
    <div class="animate-pulse h-5 w-48 rounded-lg bg-white/15"></div>
  </div>`;
}

const $ = (id) => document.getElementById(id);

/* ---------------- Загрузка и отрисовка ---------------- */
let loadingId = 0;

async function loadLocation(place, { isCurrent = false } = {}) {
  const id = ++loadingId;
  $('btn-locate').classList.toggle('text-sky-300', isCurrent);
  document.body.style.cursor = 'progress';

  try {
    const [data, geo] = await Promise.all([
      getWeather(place.lat, place.lon),
      place.name ? Promise.resolve(null) : reverseGeocode(place.lat, place.lon).catch(() => null),
    ]);
    if (id !== loadingId) return; // пользователь уже выбрал другой город

    const name = place.name || geo?.name || 'Моё местоположение';
    const country = place.country || geo?.country || '';
    storage.setLast({ name, country, lat: place.lat, lon: place.lon, isCurrent });

    render(data, { name, country, isCurrent });
  } catch (e) {
    toast(e.message, { duration: 5000 });
    if (e.status === 0) showSetupHint();
  } finally {
    document.body.style.cursor = '';
  }
}

function render(data, { name, country, isCurrent }) {
  applyTheme(themeKey(data.current.icon));

  $('loc-name').innerHTML = `${isCurrent ? `<span class="mr-1 inline-block align-[-2px] opacity-80">${UI.pin(15)}</span>` : ''}${escapeHtml(name)} ${flag(country)}`;
  $('loc-sub').textContent = formatFullDate(data.current.dt, data.tz);

  renderHero($('hero'), data);
  renderHourly($('hourly'), data);
  renderDaily($('daily'), data);
  renderDetails($('details'), data);
  refreshCities();

  gsap.fromTo(
    '[data-anim]',
    { y: 28, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' },
  );
}

function refreshCities() {
  renderCities($('cities'), {
    onSelect: (city) => loadLocation(city),
    onAdd: openSearch,
  });
}

async function locateMe({ silent = false } = {}) {
  try {
    const coords = await getPosition();
    await loadLocation(coords, { isCurrent: true });
    return true;
  } catch (e) {
    if (!silent) toast(e.message);
    return false;
  }
}

function showSetupHint() {
  $('hero').innerHTML = `
    <div class="glass-card mt-6 text-center" data-anim>
      <div class="text-lg font-semibold">Нужен API-ключ OpenWeather</div>
      <p class="mt-2 text-sm opacity-80">
        1. Зарегистрируйся на openweathermap.org<br/>
        2. Скопируй ключ из раздела API keys<br/>
        3. Создай файл <code class="rounded bg-black/20 px-1">.env</code> и добавь<br/>
        <code class="rounded bg-black/20 px-1">VITE_OWM_API_KEY=твой_ключ</code><br/>
        4. Перезапусти <code class="rounded bg-black/20 px-1">npm run dev</code>
      </p>
    </div>`;
}

/* ---------------- Блик стекла за курсором ---------------- */
function initGlassShine() {
  const update = (e) => {
    const card = e.target.closest?.('.glass, .glass-card, .glass-btn');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', update, { passive: true });
  document.addEventListener('pointerdown', update, { passive: true });
}

/* ---------------- Старт ---------------- */
async function init() {
  initBackground();
  initGlassShine();
  initServiceWorker();
  initInstallPrompt();
  initSearch({ onSelect: (city) => loadLocation(city), onSavedChange: refreshCities });

  $('btn-search').addEventListener('click', openSearch);
  $('btn-locate').addEventListener('click', () => locateMe());

  const last = storage.getLast();

  // Сразу показываем последний город (если был), параллельно определяем геолокацию
  if (last && !last.isCurrent) loadLocation(last);

  const ok = await locateMe({ silent: true });
  if (!ok && !last) {
    toast('Не удалось определить местоположение — показываю Ташкент');
    loadLocation(DEFAULT_LOCATION);
  } else if (!ok && last?.isCurrent) {
    loadLocation(last, { isCurrent: true });
  }
}

init();
