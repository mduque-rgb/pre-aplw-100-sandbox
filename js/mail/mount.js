import { browserEls } from '../browser/state.js';
import { esc, $m } from '../shared/dom.js';
import { L } from '../shared/i18n.js';
import { ic } from '../shell/icons.js';
import { closeReport, mailClick } from './actions/events.js';
import { reportIsOpen } from './actions/report.js';
import { saveSoon } from './persist.js';
import { avColor, mail } from './state.js';
import { closeCompose } from './ui/compose.js';
import { hideFb } from './ui/overlay.js';
import { drawMain, drawSide } from './ui/render.js';
import { mailToast } from './ui/toast.js';

export function mountMail(page, address) {
  mail.addr = address;
  mail.folder = 'inbox';
  mail.open = null;
  mail.q = '';
  mail.sel = new Set();
  mail.ask = null;
  browserEls.url.value = 'gmail.com/inbox';
  page.className = 'page mailpage';
  page.scrollTop = 0;
  page.innerHTML = `<div class="m-banner"><span data-l="es">Bandeja de práctica: abre un mensaje y prueba Reply, Forward o Delete. No se envía nada de verdad.</span><span data-l="en">Practice inbox. Open a message, then try Reply, Forward, or Delete. Nothing is really sent.</span></div>
  <div class="mail-app" id="mail-app">
    <aside class="m-side" id="m-side" aria-label="Folders"></aside>
    <section class="m-main">
      <div class="m-top">
        <label class="m-search">${ic('search')}<input id="m-q" type="search" placeholder="Search mail" autocomplete="off" aria-label="Search mail"></label>
        <div class="m-acct"><span class="m-av" style="background:${avColor(address)}">${esc(address.charAt(0).toUpperCase())}</span><span class="m-addr">${esc(address)}</span><button class="m-link" type="button" data-act="signout">Sign out</button></div>
      </div>
      <div class="m-body" id="m-body"></div>
    </section>
    <div class="m-compose" id="m-compose" hidden></div>
    <div class="m-toast" id="m-toast" role="status" aria-live="polite" hidden></div>
    <div class="sr-only" id="m-say" role="status" aria-live="polite"></div>
    <div class="m-fb-back" id="m-fb" hidden></div>
  </div>`;

  const root = $m('mail-app');
  root.addEventListener('click', mailClick);
  // Autosave after every interaction (clicks, keys, typing) so a reload loses nothing.
  ['click', 'keydown', 'input'].forEach((type) => root.addEventListener(type, saveSoon));
  root.addEventListener('keydown', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (event.key === 'Enter' && target.classList.contains('m-row')) target.click();
    // Step 3: the parts of an email are tappable spans, so they also answer to Enter and Space.
    if ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('ph-seg')) {
      event.preventDefault();
      target.click();
    }
    if (event.key === 'Escape') {
      if (reportIsOpen()) closeReport(false);
      else if (!$m('m-fb').hidden) hideFb();
      else if (!$m('m-compose').hidden) closeCompose();
    }
  });

  /** @type {HTMLInputElement} */ ($m('m-q')).addEventListener('input', (event) => {
    mail.q = /** @type {HTMLInputElement} */ (event.target).value;
    mail.sel = new Set();
    mail.open = null;
    mail.ask = null;
    drawMain();
  });

  drawSide();
  drawMain();
  mailToast(L('¡Excelente! Tu correo y tu contraseña son correctos.', 'Excellent! Your email and password are correct.'));
}
