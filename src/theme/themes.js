/**
 * Палитры под каждое состояние погоды.
 * bg — три цвета основного градиента, orbs — светящиеся сферы,
 * particles — эффект на canvas, fg — цвет текста, glass — прозрачность стекла.
 */
export const THEMES = {
  'clear-day': {
    bg: ['#2F84D8', '#69B1EE', '#F4C59C'],
    orbs: ['#FFD58A', '#FF9E7D', '#9AD7FF'],
    fg: '#FFFFFF',
    accent: '#FFD58A',
    glass: 0.16,
    particles: 'sun',
  },
  'clear-night': {
    bg: ['#0A1030', '#1C2559', '#3B2F6B'],
    orbs: ['#5B6CFF', '#A06BFF', '#3FD0C9'],
    fg: '#FFFFFF',
    accent: '#B9C4FF',
    glass: 0.1,
    particles: 'stars',
  },
  'clouds-day': {
    bg: ['#4F6E8E', '#7F9BB7', '#B8C8D8'],
    orbs: ['#C8D6E5', '#8FB3D9', '#E3C9B8'],
    fg: '#FFFFFF',
    accent: '#DCE7F3',
    glass: 0.14,
    particles: 'none',
  },
  'clouds-night': {
    bg: ['#141B2B', '#25324A', '#3A4A63'],
    orbs: ['#4A5D80', '#6B5A8E', '#2F6E7A'],
    fg: '#FFFFFF',
    accent: '#A9B8D6',
    glass: 0.09,
    particles: 'stars-dim',
  },
  rain: {
    bg: ['#1F2D45', '#34506F', '#54728F'],
    orbs: ['#3D7FB8', '#2FB3B3', '#6C7FD8'],
    fg: '#FFFFFF',
    accent: '#7CC8FF',
    glass: 0.11,
    particles: 'rain',
  },
  'rain-night': {
    bg: ['#0E1626', '#1D2B42', '#2F4560'],
    orbs: ['#2D5F8C', '#1F8585', '#4D5DA8'],
    fg: '#FFFFFF',
    accent: '#7CC8FF',
    glass: 0.09,
    particles: 'rain',
  },
  thunder: {
    bg: ['#140F26', '#2A2148', '#433661'],
    orbs: ['#7B5CFF', '#3DA5FF', '#C86BFA'],
    fg: '#FFFFFF',
    accent: '#C8B6FF',
    glass: 0.09,
    particles: 'storm',
  },
  snow: {
    bg: ['#8FB0D3', '#C2D6EA', '#EAF1F8'],
    orbs: ['#FFFFFF', '#B9DAFF', '#D9CCFF'],
    fg: '#1B2A41',
    accent: '#3E6FA8',
    glass: 0.22,
    particles: 'snow',
  },
  'snow-night': {
    bg: ['#1E2A44', '#3A4D6E', '#6B82A6'],
    orbs: ['#9DB8E0', '#C6B8F0', '#7FC8E0'],
    fg: '#FFFFFF',
    accent: '#CFE2FF',
    glass: 0.11,
    particles: 'snow',
  },
  mist: {
    bg: ['#5F6B7A', '#8E99A6', '#BCC4CC'],
    orbs: ['#D5DBE1', '#A7B4C2', '#C9BFB4'],
    fg: '#FFFFFF',
    accent: '#E4E9EE',
    glass: 0.15,
    particles: 'fog',
  },
};

/** OpenWeather icon code → ключ темы */
export function themeKey(icon = '01d') {
  const n = icon.slice(0, 2);
  const day = icon.endsWith('d');
  switch (n) {
    case '01':
    case '02':
      return day ? 'clear-day' : 'clear-night';
    case '03':
    case '04':
      return day ? 'clouds-day' : 'clouds-night';
    case '09':
    case '10':
      return day ? 'rain' : 'rain-night';
    case '11':
      return 'thunder';
    case '13':
      return day ? 'snow' : 'snow-night';
    case '50':
      return 'mist';
    default:
      return 'clouds-day';
  }
}
