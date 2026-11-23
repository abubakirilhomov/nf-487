import gsap from 'gsap';
import { storage } from '../services/storage.js';
import { UI } from '../utils/icons.js';

const DISMISS_KEY = 'wx:install-dismissed-at';
const DISMISS_DAYS = 7;

let deferredPrompt = null;
let el = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const recentlyDismissed = () => {
  const at = storage.get(DISMISS_KEY, 0);
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

function build({ ios }) {
  el = document.createElement('div');
  el.className = 'fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 safe-bottom pointer-events-none';
  el.innerHTML = `
    <div data-card class="glass pointer-events-auto flex w-full max-w-md items-center gap-3 !rounded-[1.6rem] p-3 pr-3.5">
      <img src="/icons/icon-192.png" alt="" class="size-12 shrink-0 rounded-[0.9rem] shadow-lg" />
      <div class="min-w-0 flex-1">
        <div class="text-[15px] font-semibold leading-tight">Установи «Погоду»</div>
        <div class="mt-0.5 text-[12.5px] leading-snug opacity-75">
          ${
            ios
              ? `Нажми ${'<span class="inline-block translate-y-[3px]">' + UI.share(14) + '</span>'} «Поделиться», затем «На экран Домой»`
              : 'Работает офлайн и открывается как обычное приложение'
          }
        </div>
      </div>
      ${
        ios
          ? ''
          : `<button data-install class="btn btn-sm h-9 rounded-full border-0 bg-white px-4 text-[13px] font-semibold text-slate-900 hover:bg-white/90">
               ${UI.download(15)} Скачать
             </button>`
      }
      <button data-dismiss class="grid size-8 shrink-0 place-items-center rounded-full opacity-60 hover:opacity-100" aria-label="Закрыть">${UI.close(16)}</button>
    </div>`;
  document.body.appendChild(el);

  el.querySelector('[data-dismiss]').addEventListener('click', () => {
    storage.set(DISMISS_KEY, Date.now());
    hide();
  });

  el.querySelector('[data-install]')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // системное окно установки
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'dismissed') storage.set(DISMISS_KEY, Date.now());
    hide();
  });
}

function show(opts) {
  if (el || isStandalone() || recentlyDismissed()) return;
  build(opts);
  gsap.fromTo(
    el.querySelector('[data-card]'),
    { y: 120, opacity: 0, scale: 0.9 },
    { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' },
  );
}

function hide() {
  if (!el) return;
  const node = el;
  el = null;
  gsap.to(node.querySelector('[data-card]'), {
    y: 120,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => node.remove(),
  });
}

export function initInstallPrompt() {
  if (isStandalone()) return;

  // Chrome / Edge / Android / Samsung Internet
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => show({ ios: false }), 2500);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hide();
  });

  // Safari на iOS не поддерживает beforeinstallprompt — показываем инструкцию
  if (isIOS()) setTimeout(() => show({ ios: true }), 3500);
}
