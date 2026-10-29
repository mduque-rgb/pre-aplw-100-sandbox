import { browserEls } from '../browser/state.js';
import { esc, $m } from '../shared/dom.js';
import { ic } from '../shell/icons.js';
import { mailClick } from './actions/events.js';
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
  page.innerHTML = `<div class="m-banner">Practice inbox. Open a message, then try Reply, Forward, or Delete. Nothing is really sent. · Bandeja de práctica: no se envía nada de verdad.</div>
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
    <div class="m-fb-back" id="m-fb" hidden></div>
  </div>`;

  const root = $m('mail-app');
  root.addEventListener('click', mailClick);
  root.addEventListener('keydown', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (event.key === 'Enter' && target.classList.contains('m-row')) target.click();
    if (event.key === 'Escape') {
      if (!$m('m-fb').hidden) hideFb();
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
  mailToast('¡Excelente! Tu correo y tu contraseña son correctos.');
}
