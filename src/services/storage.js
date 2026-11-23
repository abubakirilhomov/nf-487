const KEYS = {
  saved: 'wx:saved-cities',
  last: 'wx:last-location',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим или переполнение — не критично */
  }
}

const sameCity = (a, b) =>
  Math.abs(a.lat - b.lat) < 0.05 && Math.abs(a.lon - b.lon) < 0.05;

export const storage = {
  getSaved: () => read(KEYS.saved, []),

  isSaved: (city) => read(KEYS.saved, []).some((c) => sameCity(c, city)),

  toggleSaved(city) {
    const list = read(KEYS.saved, []);
    const exists = list.some((c) => sameCity(c, city));
    const next = exists
      ? list.filter((c) => !sameCity(c, city))
      : [...list, { name: city.name, country: city.country, lat: city.lat, lon: city.lon }];
    write(KEYS.saved, next);
    return !exists;
  },

  removeSaved(city) {
    write(
      KEYS.saved,
      read(KEYS.saved, []).filter((c) => !sameCity(c, city)),
    );
  },

  getLast: () => read(KEYS.last, null),
  setLast: (loc) => write(KEYS.last, loc),

  get: read,
  set: write,
};
