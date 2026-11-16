import { registerSW } from 'virtual:pwa-register';
import { updateGate } from './lib/updateGate';

const HOURLY = 60 * 60 * 1000;

/** Registers the service worker and keeps the installed app up to date. */
export function setupPwa() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => updateGate.updateReady(),
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // An installed app is often resumed rather than reloaded: check when it comes back, and hourly.
      const check = () => registration.update().catch(() => undefined);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
      setInterval(check, HOURLY);
    },
  });
  // Activates the waiting worker and reloads the page.
  updateGate.setApply(() => updateSW(true));
}
