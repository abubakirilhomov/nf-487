import gsap from 'gsap';
import { escapeHtml } from '../utils/format.js';

let root;

export function toast(message, { duration = 3200 } = {}) {
  if (!root) {
    root = document.createElement('div');
    root.className =
      'pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = 'glass pointer-events-auto max-w-sm rounded-full px-4 py-2.5 text-center text-sm font-medium';
  el.innerHTML = escapeHtml(message);
  root.appendChild(el);

  gsap.fromTo(el, { y: -20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
  gsap.to(el, {
    y: -16,
    opacity: 0,
    duration: 0.35,
    delay: duration / 1000,
    ease: 'power2.in',
    onComplete: () => el.remove(),
  });
}
