import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { mail } from '../state.js';

export function mailToast(text, undo) {
  const toast = $m('m-toast');
  if (!toast) return;

  mail.undo = undo || null;
  clearTimeout(mail.toastTimer);
  toast.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button" data-act="undo">Undo</button>' : ''}<button class="m-tx" type="button" data-act="toast-x" aria-label="Dismiss">${ic('x')}</button>`;
  toast.hidden = false;
  mail.toastTimer = setTimeout(hideToast, 7000);
}

export function hideToast() {
  const toast = $m('m-toast');
  if (toast) toast.hidden = true;
  clearTimeout(mail.toastTimer);
}
