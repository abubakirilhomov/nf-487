export const API_KEY = import.meta.env.VITE_OWM_API_KEY;
export const USE_ONECALL = import.meta.env.VITE_OWM_ONECALL === 'true';

export const UNITS = 'metric';
export const LANG = 'ru';

// Город по умолчанию, если геолокация недоступна или запрещена
export const DEFAULT_LOCATION = {
  name: 'Ташкент',
  country: 'UZ',
  lat: 41.2995,
  lon: 69.2401,
};

export const POPULAR_CITIES = [
  { name: 'Лондон', country: 'GB', lat: 51.5073, lon: -0.1276 },
  { name: 'Нью-Йорк', country: 'US', lat: 40.7128, lon: -74.006 },
  { name: 'Токио', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { name: 'Париж', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { name: 'Дубай', country: 'AE', lat: 25.2048, lon: 55.2708 },
  { name: 'Стамбул', country: 'TR', lat: 41.0082, lon: 28.9784 },
  { name: 'Сеул', country: 'KR', lat: 37.5665, lon: 126.978 },
  { name: 'Москва', country: 'RU', lat: 55.7558, lon: 37.6173 },
  { name: 'Сидней', country: 'AU', lat: -33.8688, lon: 151.2093 },
  { name: 'Рейкьявик', country: 'IS', lat: 64.1466, lon: -21.9426 },
];
