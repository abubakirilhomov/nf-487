import { registerSW } from 'virtual:pwa-register';
import { toast } from '../components/toast.js';

export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      toast('Приложение готово к работе офлайн');
    },
  });
}
