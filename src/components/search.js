import gsap from 'gsap';
import { searchCities } from '../api/weather.js';
import { storage } from '../services/storage.js';
import { POPULAR_CITIES } from '../config.js';
import { UI } from '../utils/icons.js';
import { debounce, escapeHtml, flag, regionName } from '../utils/format.js';

let sheet;
let onSelectCb;
let onSavedChangeCb;
let results = [];

export function initSearch({ onSelect, onSavedChange }) {
  onSelectCb = onSelect;
  onSavedChangeCb = onSavedChange;

  sheet = document.createElement('div');
  sheet.className = 'fixed inset-0 z-50 hidden';
  sheet.innerHTML = `
    <div data-backdrop class="absolute inset-0 bg-black/30 backdrop-blur-md"></div>
    <div data-panel class="glass relative mx-auto mt-[max(0.75rem,env(safe-area-inset-top))] flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-lg flex-col !rounded-[2rem] p-4">
      <div class="flex items-center gap-2">
        <label class="glass flex flex-1 items-center gap-2 !rounded-full px-4 py-3">
          <span class="opacity-70">${UI.search(18)}</span>
          <input data-input type="search" autocomplete="off" enterkeyhint="search"
            placeholder="Город или место…"
            class="w-full bg-transparent text-[16px] outline-none placeholder:text-current placeholder:opacity-50" />
          <span data-loading class="loading loading-spinner loading-sm hidden"></span>
        </label>
        <button data-close class="glass-btn" aria-label="Закрыть">${UI.close(18)}</button>
      </div>
      <div data-results class="no-scrollbar mt-3 flex-1 overflow-y-auto"></div>
    </div>`;
  document.body.appendChild(sheet);

  const input = sheet.querySelector('[data-input]');
  const loading = sheet.querySelector('[data-loading]');

  const run = debounce(async (q) => {
    if (q.trim().length < 2) {
      renderPopular();
      return;
    }
    loading.classList.remove('hidden');
    try {
      results = await searchCities(q.trim());
      renderResults();
    } catch (e) {
      sheet.querySelector('[data-results]').innerHTML = `<p class="p-4 text-center text-sm opacity-75">${escapeHtml(e.message)}</p>`;
    } finally {
      loading.classList.add('hidden');
    }
  }, 350);

  input.addEventListener('input', (e) => run(e.target.value));
  sheet.querySelector('[data-close]').addEventListener('click', closeSearch);
  sheet.querySelector('[data-backdrop]').addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeSearch());

  sheet.querySelector('[data-results]').addEventListener('click', (e) => {
    const starBtn = e.target.closest('[data-star]');
    const row = e.target.closest('[data-index]');
    if (!row) return;
    const list = row.dataset.list === 'popular' ? POPULAR_CITIES : results;
    const city = list[Number(row.dataset.index)];

    if (starBtn) {
      e.stopPropagation();
      const saved = storage.toggleSaved(city);
      starBtn.classList.toggle('text-amber-300', saved);
      starBtn.querySelector('svg').setAttribute('fill', saved ? 'currentColor' : 'none');
      gsap.fromTo(starBtn, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      onSavedChangeCb?.();
      return;
    }
    closeSearch();
    onSelectCb?.(city);
  });
}

function row(city, i, list) {
  const saved = storage.isSaved(city);
  const sub = [city.state, regionName(city.country)].filter(Boolean).join(', ');
  return `
    <div data-index="${i}" data-list="${list}" role="button" tabindex="0"
      class="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/10 active:bg-white/15">
      <span class="text-2xl">${flag(city.country)}</span>
      <div class="min-w-0 flex-1">
        <div class="truncate font-semibold">${escapeHtml(city.name)}</div>
        <div class="truncate text-[13px] opacity-65">${escapeHtml(sub)}</div>
      </div>
      <button data-star class="grid size-9 place-items-center rounded-full ${saved ? 'text-amber-300' : 'opacity-70'}" aria-label="В избранное">
        ${UI.star(18).replace('fill="none"', `fill="${saved ? 'currentColor' : 'none'}"`)}
      </button>
    </div>`;
}

function renderResults() {
  const box = sheet.querySelector('[data-results]');
  box.innerHTML = results.length
    ? results.map((c, i) => row(c, i, 'results')).join('')
    : '<p class="p-6 text-center text-sm opacity-70">Ничего не найдено. Попробуй написать по-английски</p>';
  gsap.from(box.children, { y: 10, opacity: 0, stagger: 0.04, duration: 0.35, ease: 'power2.out' });
}

function renderPopular() {
  const box = sheet.querySelector('[data-results]');
  box.innerHTML = `
    <div class="section-title mt-1 px-3">Города мира</div>
    ${POPULAR_CITIES.map((c, i) => row(c, i, 'popular')).join('')}`;
}

export function openSearch() {
  sheet.classList.remove('hidden');
  renderPopular();
  const input = sheet.querySelector('[data-input]');
  input.value = '';
  gsap.fromTo(sheet.querySelector('[data-backdrop]'), { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.fromTo(
    sheet.querySelector('[data-panel]'),
    { y: -30, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', onComplete: () => input.focus() },
  );
}

export function closeSearch() {
  if (!sheet || sheet.classList.contains('hidden')) return;
  gsap.to(sheet.querySelector('[data-panel]'), { y: -20, opacity: 0, scale: 0.97, duration: 0.25, ease: 'power2.in' });
  gsap.to(sheet.querySelector('[data-backdrop]'), {
    opacity: 0,
    duration: 0.25,
    onComplete: () => sheet.classList.add('hidden'),
  });
}
