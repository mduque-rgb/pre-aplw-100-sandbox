import { esc, $m } from '../../shared/dom.js';
import { L } from '../../shared/i18n.js';
import { ic } from '../../shell/icons.js';
import { mail } from '../state.js';

const MIN_MS = 8000;
const MS_PER_WORD = 450; // a slow, careful reading pace

/**
 * How long a message stays on screen: longer texts stay longer.
 * @param {string} text
 */
export const toastDuration = (text) => Math.max(MIN_MS, text.split(/\s+/).filter(Boolean).length * MS_PER_WORD);

let remaining = 0;
let startedAt = 0;

function schedule(ms) {
  clearTimeout(mail.toastTimer);
  remaining = ms;
  startedAt = Date.now();
  mail.toastTimer = setTimeout(hideToast, ms);
}

function pause() {
  if (!mail.toastTimer) return;
  clearTimeout(mail.toastTimer);
  mail.toastTimer = null;
  remaining = Math.max(2000, remaining - (Date.now() - startedAt));
}

function resume() {
  const toast = $m('m-toast');
  if (toast && !toast.hidden && !mail.toastTimer) schedule(remaining);
}

/**
 * @param {string} text
 * @param {() => void} [undo]
 */
export function mailToast(text, undo) {
  const toast = $m('m-toast');
  if (!toast) return;

  mail.undo = undo || null;
  toast.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button" data-act="undo">Undo</button>' : ''}<button class="m-tx" type="button" data-act="toast-x" aria-label="${L('Cerrar aviso', 'Dismiss')}">${ic('x')}</button>`;
  toast.hidden = false;

  // Pause while the learner is looking at or touching the message.
  if (!toast.dataset.bound) {
    toast.dataset.bound = '1';
    toast.addEventListener('pointerenter', pause);
    toast.addEventListener('pointerleave', resume);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('focusout', resume);
  }
  schedule(toastDuration(text));
}

export function hideToast() {
  const toast = $m('m-toast');
  if (toast) toast.hidden = true;
  clearTimeout(mail.toastTimer);
  mail.toastTimer = null;
}
