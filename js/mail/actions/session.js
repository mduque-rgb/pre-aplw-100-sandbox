import { browser } from '../../browser/browser.js';
import { $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { logTry } from '../domain/mission.js';
import { withDone } from '../domain/mission-state.js';
import { mail } from '../state.js';
import { closeCompose } from '../ui/compose.js';
import { hideFb } from '../ui/overlay.js';

export function askSignOut() {
  const mission = mail.mission;
  if (mission.step === 7 && !mission.done) logTry(7);

  $m('m-fb').innerHTML = `<div class="m-fb" role="alertdialog" aria-modal="true" aria-labelledby="fb-h" aria-describedby="so-d">
    <div class="fb-top"><span class="fb-tick mr-q" aria-hidden="true">?</span><h2 id="fb-h">Are you sure you want to sign out?</h2></div>
    <p class="so-q" id="so-d"><b>¿Seguro que quieres cerrar sesión?</b> Para volver a entrar tendrás que escribir otra vez tu correo y tu contraseña.</p>
    ${mission.step === 7 && !mission.done ? '<p class="fb-retry"><b>Antes de salir, revisa:</b> ¿terminaste lo que estabas haciendo? Si dejaste un correo a medias, toca “Cancel”. Si ya terminaste, toca “Sign out”.</p>' : ''}
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="so-confirm">Sign out</button><button class="m-big" type="button" data-act="so-cancel">Cancel</button></div>
  </div>`;
  $m('m-fb').hidden = false;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('[data-act=so-cancel]')).focus();
}

export function signOut() {
  const mission = mail.mission;
  const isPracticeStep = mission.step === 7 && !mission.done;
  hideFb();
  closeCompose();

  if (!isPracticeStep) {
    browser.render('gmail.com');
    return;
  }

  mail.mission = withDone(mission);
  const toast = $m('m-toast');
  if (toast) toast.hidden = true;

  const overlay = document.createElement('div');
  overlay.className = 'm-out';
  overlay.id = 'm-out';
  overlay.innerHTML = `<div class="m-out-card" role="status">
    <div class="so-ic" aria-hidden="true">${ic('check')}</div>
    <h2>You’re signed out</h2><p class="so-es">Cerraste tu sesión</p>
    <p class="fb-mission"><b>¡Paso 7 completado!</b> ¡Terminaste las siete prácticas de correo!</p>
    <ul class="so-tips"><li>Cierra tu sesión siempre que uses una tableta o computadora compartida, como en la biblioteca. Así nadie más puede leer tus correos.</li><li>Para volver a entrar, tendrás que escribir tu correo y tu contraseña.</li></ul>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="report">Ver mi informe</button><button class="m-big" type="button" data-act="so-login">Volver a iniciar sesión</button></div>
  </div>`;

  $m('mail-app').appendChild(overlay);
  const banner = /** @type {HTMLElement|null} */ (browser.el.page.querySelector('.m-banner'));
  if (banner) banner.hidden = true;
  browser.el.url.value = 'gmail.com';
  browser.el.tab.textContent = 'Signed out';
  /** @type {HTMLElement} */ (overlay.querySelector('.m-big')).focus();
}
