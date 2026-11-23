/**
 * Определяет текущее местоположение пользователя.
 * Работает только по HTTPS или на localhost.
 */
export function getPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Геолокация не поддерживается браузером'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        const messages = {
          1: 'Доступ к геолокации запрещён',
          2: 'Не удалось определить местоположение',
          3: 'Время ожидания геолокации истекло',
        };
        reject(new Error(messages[err.code] || 'Ошибка геолокации'));
      },
      { enableHighAccuracy: false, timeout, maximumAge: 10 * 60 * 1000 },
    );
  });
}
