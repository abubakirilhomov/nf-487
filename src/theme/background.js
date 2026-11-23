import gsap from 'gsap';
import { THEMES } from './themes.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let particles;
let currentKey = null;

/* ---------------- Плавающие сферы ---------------- */
function animateOrbs() {
  if (reduceMotion) return;
  document.querySelectorAll('.orb').forEach((orb, i) => {
    gsap.to(orb, {
      x: () => gsap.utils.random(-120, 120),
      y: () => gsap.utils.random(-90, 90),
      scale: () => gsap.utils.random(0.85, 1.2),
      duration: gsap.utils.random(9, 14),
      ease: 'sine.inOut',
      repeat: -1,
      repeatRefresh: true,
      yoyo: true,
      delay: i * 0.6,
    });
  });
}

/* ---------------- Смена темы ---------------- */
export function applyTheme(key) {
  const theme = THEMES[key] || THEMES['clouds-day'];
  if (key === currentKey) return;
  const first = currentKey === null;
  currentKey = key;

  const root = document.documentElement;
  const vars = {
    '--bg1': theme.bg[0],
    '--bg2': theme.bg[1],
    '--bg3': theme.bg[2],
    '--orb1': theme.orbs[0],
    '--orb2': theme.orbs[1],
    '--orb3': theme.orbs[2],
    '--fg': theme.fg,
    '--accent': theme.accent,
    '--glass-alpha': theme.glass,
  };
  gsap.to(root, { ...vars, duration: first ? 0 : 1.8, ease: 'power2.inOut' });

  // сферы ярче в солнечную погоду и спокойнее в пасмурную
  const orbOpacity = { sun: 0.75, stars: 0.5, snow: 0.6, fog: 0.4, none: 0.45 }[theme.particles] ?? 0.5;
  gsap.to('.orb', { opacity: orbOpacity, duration: 1.8 });

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg[0]);
  root.dataset.weather = key;
  particles?.setMode(theme.particles);
}

/* ---------------- Частицы на canvas ---------------- */
class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'none';
    this.items = [];
    this.flashTimer = null;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this.loop);
      }
    });
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.spawn();
  }

  setMode(mode) {
    this.mode = reduceMotion && mode !== 'stars' ? 'none' : mode;
    clearTimeout(this.flashTimer);
    if (this.mode === 'storm') this.scheduleFlash();
    this.spawn();
  }

  spawn() {
    const { w, h } = this;
    const area = (w * h) / (1280 * 800);
    const r = gsap.utils.random;
    const make = {
      rain: () =>
        Array.from({ length: Math.round(140 * area) + 40 }, () => ({
          x: r(0, w), y: r(0, h), len: r(10, 22), v: r(9, 15), o: r(0.15, 0.4),
        })),
      storm: () =>
        Array.from({ length: Math.round(200 * area) + 60 }, () => ({
          x: r(0, w), y: r(0, h), len: r(14, 28), v: r(13, 20), o: r(0.15, 0.45),
        })),
      snow: () =>
        Array.from({ length: Math.round(90 * area) + 30 }, () => ({
          x: r(0, w), y: r(0, h), rad: r(1.2, 3.6), v: r(0.4, 1.3), drift: r(0, Math.PI * 2), o: r(0.5, 0.95),
        })),
      stars: () =>
        Array.from({ length: Math.round(110 * area) + 30 }, () => ({
          x: r(0, w), y: r(0, h * 0.7), rad: r(0.4, 1.5), phase: r(0, Math.PI * 2), speed: r(0.01, 0.03),
        })),
      'stars-dim': () =>
        Array.from({ length: Math.round(35 * area) + 10 }, () => ({
          x: r(0, w), y: r(0, h * 0.5), rad: r(0.4, 1.1), phase: r(0, Math.PI * 2), speed: r(0.01, 0.02),
        })),
      fog: () =>
        Array.from({ length: 7 }, () => ({
          x: r(-w * 0.3, w), y: r(h * 0.2, h), rad: r(w * 0.25, w * 0.5), v: r(0.1, 0.35), o: r(0.06, 0.12),
        })),
      sun: () =>
        Array.from({ length: 18 }, () => ({
          x: r(0, w), y: r(0, h), rad: r(1, 2.5), v: r(0.1, 0.3), phase: r(0, Math.PI * 2), o: r(0.2, 0.5),
        })),
    };
    this.items = make[this.mode]?.() ?? [];
  }

  scheduleFlash() {
    this.flashTimer = setTimeout(() => {
      gsap
        .timeline()
        .to('#flash', { opacity: 1, duration: 0.06 })
        .to('#flash', { opacity: 0.2, duration: 0.1 })
        .to('#flash', { opacity: 0.8, duration: 0.05 })
        .to('#flash', { opacity: 0, duration: 0.6, ease: 'power2.out' });
      this.scheduleFlash();
    }, gsap.utils.random(4000, 11000));
  }

  loop() {
    if (document.hidden) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    switch (this.mode) {
      case 'rain':
      case 'storm':
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.2;
        for (const p of this.items) {
          ctx.strokeStyle = `rgba(200,225,255,${p.o})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.len * 0.25, p.y + p.len);
          ctx.stroke();
          p.y += p.v;
          p.x -= p.v * 0.25;
          if (p.y > h) {
            p.y = -p.len;
            p.x = Math.random() * (w + 100);
          }
        }
        break;

      case 'snow':
        for (const p of this.items) {
          p.drift += 0.01;
          p.y += p.v;
          p.x += Math.sin(p.drift) * 0.5;
          if (p.y > h + 5) {
            p.y = -5;
            p.x = Math.random() * w;
          }
          ctx.fillStyle = `rgba(255,255,255,${p.o})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'stars':
      case 'stars-dim':
        for (const p of this.items) {
          p.phase += p.speed;
          const o = 0.35 + Math.sin(p.phase) * 0.35;
          ctx.fillStyle = `rgba(255,255,255,${o})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'fog':
        for (const p of this.items) {
          p.x += p.v;
          if (p.x - p.rad > w) p.x = -p.rad;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad);
          g.addColorStop(0, `rgba(255,255,255,${p.o})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(p.x - p.rad, p.y - p.rad, p.rad * 2, p.rad * 2);
        }
        break;

      case 'sun':
        // мягкие «пылинки» в солнечных лучах
        for (const p of this.items) {
          p.phase += 0.01;
          p.y -= p.v;
          p.x += Math.sin(p.phase) * 0.3;
          if (p.y < -5) {
            p.y = h + 5;
            p.x = Math.random() * w;
          }
          ctx.fillStyle = `rgba(255,240,200,${p.o * (0.6 + Math.sin(p.phase * 2) * 0.4)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    this.raf = requestAnimationFrame(this.loop);
  }
}

export function initBackground() {
  particles = new Particles(document.getElementById('particles'));
  animateOrbs();
  applyTheme('clear-night');
}
