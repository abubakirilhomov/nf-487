import { API_KEY, USE_ONECALL, UNITS, LANG } from '../config.js';

const BASE = 'https://api.openweathermap.org';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, params = {}) {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    throw new ApiError('Не найден API-ключ. Добавь VITE_OWM_API_KEY в файл .env', 0);
  }
  const url = new URL(path, BASE);
  Object.entries({ ...params, appid: API_KEY }).forEach(([k, v]) => url.searchParams.set(k, v));

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError('Нет соединения с интернетом', -1);
  }
  if (!res.ok) {
    const messages = {
      401: 'Ключ API недействителен. Новый ключ OpenWeather активируется до 2 часов',
      404: 'Место не найдено',
      429: 'Слишком много запросов, попробуй через минуту',
    };
    throw new ApiError(messages[res.status] || `Ошибка сервера (${res.status})`, res.status);
  }
  return res.json();
}

/* ---------------- Геокодинг ---------------- */

const normalizePlace = (p) => ({
  name: p.local_names?.ru || p.name,
  country: p.country,
  state: p.state || '',
  lat: p.lat,
  lon: p.lon,
});

export async function searchCities(query) {
  const data = await request('/geo/1.0/direct', { q: query, limit: 6 });
  // убираем дубли (один и тот же город с разными координатами в пределах ~5 км)
  const seen = new Set();
  return data.map(normalizePlace).filter((p) => {
    const key = `${p.name}-${p.country}-${p.lat.toFixed(1)}-${p.lon.toFixed(1)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function reverseGeocode(lat, lon) {
  const data = await request('/geo/1.0/reverse', { lat, lon, limit: 1 });
  return data[0] ? normalizePlace(data[0]) : null;
}

/* ---------------- Погода ---------------- */

/** Лёгкий запрос: только текущая погода (для карточек «Мои города») */
export async function getCurrent(lat, lon) {
  const d = await request('/data/2.5/weather', { lat, lon, units: UNITS, lang: LANG });
  return {
    temp: d.main.temp,
    min: d.main.temp_min,
    max: d.main.temp_max,
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    tz: d.timezone,
    dt: d.dt,
  };
}

/**
 * Полные данные: текущая погода, почасовой и дневной прогноз.
 * Возвращает единый формат независимо от тарифа.
 */
export async function getWeather(lat, lon) {
  return USE_ONECALL ? getOneCall(lat, lon) : getFree(lat, lon);
}

async function getOneCall(lat, lon) {
  const d = await request('/data/3.0/onecall', {
    lat,
    lon,
    units: UNITS,
    lang: LANG,
    exclude: 'minutely,alerts',
  });
  const c = d.current;
  return {
    source: 'onecall',
    tz: d.timezone_offset,
    current: {
      dt: c.dt,
      temp: c.temp,
      feels: c.feels_like,
      humidity: c.humidity,
      pressure: c.pressure,
      dewPoint: c.dew_point,
      uvi: c.uvi,
      clouds: c.clouds,
      visibility: c.visibility ?? 10000,
      windSpeed: c.wind_speed,
      windDeg: c.wind_deg,
      windGust: c.wind_gust,
      description: c.weather[0].description,
      icon: c.weather[0].icon,
      id: c.weather[0].id,
      sunrise: c.sunrise,
      sunset: c.sunset,
      min: d.daily[0].temp.min,
      max: d.daily[0].temp.max,
      pop: d.daily[0].pop,
    },
    hourly: d.hourly.slice(0, 25).map((h) => ({
      dt: h.dt,
      temp: h.temp,
      icon: h.weather[0].icon,
      pop: h.pop,
    })),
    daily: d.daily.map((x) => ({
      dt: x.dt,
      min: x.temp.min,
      max: x.temp.max,
      icon: x.weather[0].icon.replace('n', 'd'),
      description: x.weather[0].description,
      pop: x.pop,
      sunrise: x.sunrise,
      sunset: x.sunset,
    })),
  };
}

async function getFree(lat, lon) {
  const [w, f] = await Promise.all([
    request('/data/2.5/weather', { lat, lon, units: UNITS, lang: LANG }),
    request('/data/2.5/forecast', { lat, lon, units: UNITS, lang: LANG }),
  ]);
  const tz = w.timezone;

  const current = {
    dt: w.dt,
    temp: w.main.temp,
    feels: w.main.feels_like,
    humidity: w.main.humidity,
    pressure: w.main.pressure,
    dewPoint: null,
    uvi: null,
    clouds: w.clouds.all,
    visibility: w.visibility ?? 10000,
    windSpeed: w.wind.speed,
    windDeg: w.wind.deg,
    windGust: w.wind.gust,
    description: w.weather[0].description,
    icon: w.weather[0].icon,
    id: w.weather[0].id,
    sunrise: w.sys.sunrise,
    sunset: w.sys.sunset,
  };

  // Прогноз с шагом 3 часа → группируем по локальным дням
  const dayKey = (dt) => new Date((dt + tz) * 1000).toISOString().slice(0, 10);
  const groups = new Map();
  for (const item of f.list) {
    const key = dayKey(item.dt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const todayKey = dayKey(current.dt);
  const daily = [...groups.entries()].map(([key, items]) => {
    const temps = items.flatMap((i) => [i.main.temp_min, i.main.temp_max]);
    if (key === todayKey) temps.push(current.temp);
    // иконка дня — запись, ближайшая к 13:00 местного времени
    const midday = items.reduce((best, i) => {
      const h = new Date((i.dt + tz) * 1000).getUTCHours();
      const bh = new Date((best.dt + tz) * 1000).getUTCHours();
      return Math.abs(h - 13) < Math.abs(bh - 13) ? i : best;
    });
    return {
      dt: items[0].dt,
      min: Math.min(...temps),
      max: Math.max(...temps),
      icon: midday.weather[0].icon.replace('n', 'd'),
      description: midday.weather[0].description,
      pop: Math.max(...items.map((i) => i.pop ?? 0)),
    };
  });

  if (daily[0] && dayKey(daily[0].dt) !== todayKey) {
    daily.unshift({
      dt: current.dt,
      min: current.temp,
      max: current.temp,
      icon: current.icon.replace('n', 'd'),
      description: current.description,
      pop: 0,
    });
  }

  current.min = daily[0].min;
  current.max = daily[0].max;
  current.pop = daily[0].pop;

  const hourly = [
    { dt: current.dt, temp: current.temp, icon: current.icon, pop: 0 },
    ...f.list.slice(0, 16).map((h) => ({
      dt: h.dt,
      temp: h.main.temp,
      icon: h.weather[0].icon,
      pop: h.pop ?? 0,
    })),
  ];

  return { source: 'free', tz, current, hourly, daily: daily.slice(0, 6) };
}
