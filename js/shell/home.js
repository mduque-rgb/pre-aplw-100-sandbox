import { browser } from '../browser/browser.js';
import { $m } from '../shared/dom.js';
import { APP_ICONS } from './icons.js';
import { nudge } from './nudge.js';

const HOME_APPS = [
  ['messages', 'Messages'],
  ['photos', 'Photos'],
  ['camera', 'Camera'],
  ['calendar', 'Calendar'],
  ['clock', 'Clock'],
  ['notes', 'Notes'],
  ['maps', 'Maps'],
  ['settings', 'Settings'],
  ['calc', 'Calculator'],
  ['music', 'Music'],
  ['store', 'App Store'],
];

const DOCK_APPS = [
  ['browser', 'Browser'],
  ['mail', 'Mail'],
  ['messages', 'Messages'],
  ['notes', 'Notes'],
];

const opened = new Set();

function makeApp(key, label) {
  const button = document.createElement('button');
  button.className = 'app';
  button.dataset.app = key;
  button.title = label;
  button.innerHTML = `<span class="icon" style="background:${APP_ICONS[key].bg}">${APP_ICONS[key].svg}</span><span class="label">${label}</span>`;
  button.addEventListener('click', () => openApp(key));
  return button;
}

export function buildHome() {
  const apps = $m('apps');
  const dock = $m('dock');
  HOME_APPS.forEach(([key, label]) => apps.appendChild(makeApp(key, label)));
  DOCK_APPS.forEach(([key, label]) => dock.appendChild(makeApp(key, label)));
}

export function openApp(key) {
  const layer = $m(`app-${key}`);
  if (!layer) return;

  opened.add(key);
  nudge.clear();
  layer.classList.add('open');
  layer.setAttribute('aria-hidden', 'false');

  if (key === 'browser' && !browser.loaded) browser.go('start');
  if (key === 'browser') {
    browser.barUsed = false;
    nudge.after(10000, () => browser.barUsed, '.browser .address', 'up');
  }
}

export function goHome() {
  nudge.clear();
  document.querySelectorAll('.layer.open').forEach((layer) => {
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
  });
}

export function bindHome() {
  $m('homebar').addEventListener('click', goHome);
  nudge.after(10000, () => opened.has('browser'), '.dock .app[data-app="browser"] .icon');
}
