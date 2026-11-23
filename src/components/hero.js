import gsap from 'gsap';
import { weatherIcon } from '../utils/icons.js';
import { capitalize, t } from '../utils/format.js';

let lastTemp = 0;

export function renderHero(el, { current }) {
  el.innerHTML = `
    <div class="flex flex-col items-center py-6 text-center sm:py-10" data-anim>
      <div class="mb-1" data-hero-icon>${weatherIcon(current.icon, 132)}</div>
      <div class="text-glow flex items-start font-extralight leading-none tracking-tighter">
        <span data-temp class="text-[96px] sm:text-[120px]">${Math.round(lastTemp)}</span>
        <span class="mt-3 text-5xl sm:text-6xl opacity-80">°</span>
      </div>
      <p class="mt-1 text-xl font-medium">${capitalize(current.description)}</p>
      <p class="mt-1.5 text-[15px] opacity-75">
        Макс. ${t(current.max)} &nbsp;·&nbsp; Мин. ${t(current.min)}
      </p>
    </div>`;

  // счётчик температуры
  const node = el.querySelector('[data-temp]');
  const obj = { v: lastTemp };
  gsap.to(obj, {
    v: current.temp,
    duration: 1.4,
    ease: 'power3.out',
    onUpdate: () => (node.textContent = Math.round(obj.v)),
  });
  lastTemp = current.temp;

  gsap.fromTo(
    el.querySelector('[data-hero-icon]'),
    { scale: 0.6, opacity: 0, rotate: -10 },
    { scale: 1, opacity: 1, rotate: 0, duration: 1.1, ease: 'elastic.out(1, 0.6)' },
  );
}
