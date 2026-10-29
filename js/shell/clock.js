import { $m } from '../shared/dom.js';

export function startClock() {
  const tick = () => {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    $m('clock').textContent = `${hours}:${minutes}`;
  };

  tick();
  setInterval(tick, 15000);
}
