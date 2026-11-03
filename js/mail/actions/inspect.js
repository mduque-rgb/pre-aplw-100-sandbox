/**
 * Step 3 detective game: what happens when the learner taps a part of an email,
 * asks for a hint, or reports the fake email.
 * The step is complete once every warning sign is found and the email is in Spam, in either order.
 */
import { $m } from '../../shared/dom.js';
import { L, tx } from '../../shared/i18n.js';
import { ic } from '../../shell/icons.js';
import { SIGN_COUNT, SIGN_HINTS } from '../data/phishing.js';
import { allFound, firstMissing } from '../domain/inspect.js';
import { logHelp } from '../domain/mission.js';
import { withFound, withStep } from '../domain/mission-state.js';
import { STEP } from '../mission-steps.js';
import { byId, mail, phishMsg } from '../state.js';
import { phishOf } from '../ui/inspect.js';
import { drawMain, drawSide } from '../ui/render.js';

/** Normal taps in a row before a hint appears on its own. */
const MISSES_BEFORE_HINT = 3;

/** Says the note aloud for screen readers, since the panel is redrawn. */
function say(html) {
  const live = $m('m-say');
  if (!live) return;
  const text = document.createElement('div');
  text.innerHTML = html;
  live.textContent = text.textContent || '';
}

/** Redraws the email and puts the focus back on the piece that was tapped. */
function redraw(pieceId) {
  drawMain();
  const piece = pieceId && /** @type {HTMLElement|null} */ ($m('m-body').querySelector(`[data-piece="${pieceId}"]`));
  if (piece) piece.focus({ preventScroll: true });
}

/** @param {import('../types.js').MailMessage} message */
function hintFor(message) {
  const phish = phishOf(message);
  if (!phish) {
    return L(
      '<b>Pista:</b> este correo no parece tener señales de alerta. Si no ves nada raro, probablemente es real: toca <b>Back</b> y abre otro.',
      '<b>Hint:</b> this email doesn’t seem to have any warning signs. If nothing looks strange, it is probably real: tap <b>Back</b> and open another one.',
    );
  }
  return `<b>${L('Pista:', 'Hint:')}</b> ${tx(SIGN_HINTS[firstMissing(mail.mission.found)])}`;
}

function logHint(message) {
  logHelp(
    STEP.REPORT_PHISH,
    phishOf(message)
      ? { es: 'Usaste una pista para encontrar una señal de alerta', en: 'You used a hint to find a warning sign' }
      : { es: 'Usaste una pista en un correo real', en: 'You used a hint on a real email' },
    'phish',
  );
}

/** Completes step 3 when every sign is found and the fake email is already in Spam. */
function completeIfReady() {
  const phish = phishMsg();
  if (mail.mission.step !== STEP.REPORT_PHISH || mail.mission.done || !phish || phish.folder !== 'spam' || !allFound(mail.mission.found)) return false;
  mail.mission = withStep(mail.mission, STEP.REPLY_SOFIA);
  // Back to the inbox, where step 4 starts.
  mail.folder = 'inbox';
  mail.open = null;
  drawSide();
  drawMain();
  showPhishDone(phish);
  return true;
}

/** @param {HTMLElement} element  the tapped piece */
export function tapPiece(element) {
  const message = byId(mail.open);
  if (!message) return;
  const phish = phishOf(message);
  const sign = Number(element.dataset.sign);
  const state = mail.inspect && mail.inspect.id === message.id ? mail.inspect : { id: message.id, note: '', misses: 0 };
  let { misses } = state;
  let note;

  if (phish && sign >= 0) {
    const item = phish.signs[sign];
    if (mail.mission.found.has(sign)) {
      note = L(`Ya encontraste esta señal: <b>${tx(item.title)}</b>. Busca otra.`, `You already found this sign: <b>${tx(item.title)}</b>. Look for another one.`);
    } else {
      mail.mission = withFound(mail.mission, sign);
      misses = 0;
      note = `<b>✓ ${tx(item.title)}.</b> ${tx(item.why)}`;
      if (allFound(mail.mission.found)) {
        note += message.folder === 'spam'
          ? ''
          : L(` <b>¡Encontraste las ${SIGN_COUNT} señales!</b>`, ` <b>You found all ${SIGN_COUNT} signs!</b>`);
      }
    }
  } else {
    misses += 1;
    note = L('Eso parece normal. Sigue buscando.', 'That looks normal. Keep looking.');
    if (misses >= MISSES_BEFORE_HINT) {
      note = hintFor(message);
      logHint(message);
      misses = 0;
    }
  }

  mail.inspect = { id: message.id, note, misses };
  if (completeIfReady()) return;
  redraw(element.dataset.piece);
  say(note);
}

export function askHint() {
  const message = byId(mail.open);
  if (!message) return;
  const note = hintFor(message);
  logHint(message);
  mail.inspect = { id: message.id, note, misses: 0 };
  redraw('');
  say(note);
}

/** Opens the fake email in Spam so the learner can keep looking for signs. */
export function reopenPhish() {
  const phish = phishMsg();
  if (!phish) return;
  mail.folder = phish.folder;
  mail.open = phish.id;
  mail.sel = new Set();
  mail.ask = null;
  drawSide();
  drawMain();
}

/** The learner asked for a hint to find which email is fake. */
export function askFindHint() {
  mail.findHint = true;
  logHelp(STEP.REPORT_PHISH, { es: 'Pediste una pista para encontrar el correo falso', en: 'You asked for a hint to find the fake email' }, 'phish');
  drawMain();
}

function dialog(title, body, actions) {
  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('spam')}</span><h2 id="fb-h">${title}</h2></div>
    ${body}
    <div class="fb-actions">${actions}</div>
  </div>`;
  $m('m-fb').hidden = false;
  const box = $m('m-fb').querySelector('.m-fb');
  box.scrollTop = 0;
  /** @type {HTMLElement} */ (box.querySelector('.fb-actions button')).focus({ preventScroll: true });
}

const REMEMBER = () => `<p class="fb-retry"><b>${L('Recuerda:', 'Remember:')}</b> ${L(
  'si un correo se ve así, no lo respondas, no toques sus enlaces y nunca compartas tu contraseña. Solo repórtalo como spam.',
  'if an email looks like this, don’t reply, don’t tap its links and never share your password. Just report it as spam.',
)}</p>`;

/** @param {import('../types.js').MailMessage} message */
function showPhishDone(message) {
  const phish = phishOf(message);
  dialog(
    L('¡Caso resuelto, detective!', 'Case solved, detective!'),
    `<p class="fb-mission">${L(
      `<b>¡Paso 3 completado!</b> Encontraste las ${SIGN_COUNT} señales de alerta y el correo falso está en la carpeta Spam.`,
      `<b>Step 3 complete!</b> You found all ${SIGN_COUNT} warning signs and the fake email is in the Spam folder.`,
    )}</p>
    <p>${L('Este tipo de correo se llama <b>phishing</b> (suplantación): alguien finge ser otra persona o empresa para robar tu información. Estas son las señales que descubriste:', 'This kind of email is called <b>phishing</b>: someone pretends to be another person or company to steal your information. These are the signs you uncovered:')}</p>
    <ul class="fb-list">${phish.signs.map((sign) => `<li class="fb-item ok"><span class="fb-ic" aria-hidden="true"></span><div><b>${tx(sign.title)}</b><div>${tx(sign.why)}</div></div></li>`).join('')}</ul>
    ${REMEMBER()}`,
    `<button class="m-big primary" type="button" data-act="mr-close">${L('Continuar', 'Continue')}</button>`,
  );
}

/**
 * After the fake email is reported as spam.
 * @param {import('../types.js').MailMessage} message
 * @param {boolean} phishDone  this report completed step 3
 * @param {number} step  the step the learner was on when they reported it
 * @returns {boolean} whether a dialog is shown
 */
export function showPhishReported(message, phishDone, step) {
  if (phishDone) {
    showPhishDone(message);
    return true;
  }

  if (step === STEP.REPORT_PHISH) {
    const found = mail.mission.found.size;
    dialog(
      L('¡Bien pensado! Este correo sí es falso', 'Good thinking! This email really is fake'),
      `<p>${L('El correo ya está en la carpeta Spam.', 'The email is now in the Spam folder.')}</p>
      <p class="fb-mission">${L(
        `Pero un buen detective encuentra todas las pistas: llevas <b>${found} de ${SIGN_COUNT}</b> señales de alerta. Ábrelo otra vez y sigue buscando para completar el paso 3.`,
        `But a good detective finds every clue: you have found <b>${found} of ${SIGN_COUNT}</b> warning signs. Open it again and keep looking to complete step 3.`,
      )}</p>`,
      `<button class="m-big primary" type="button" data-act="ph-reopen">${L('Seguir investigando', 'Keep investigating')}</button>`,
    );
    return true;
  }

  if (step < STEP.REPORT_PHISH && !mail.mission.done) {
    dialog(
      L('¡Bien visto! Este correo es falso', 'Well spotted! This email is fake'),
      `<p>${L('Lo reportaste como spam y ya no está en tu bandeja de entrada.', 'You reported it as spam and it is no longer in your inbox.')}</p>
      <p>${L('En el <b>paso 3</b> lo vas a investigar como detective, desde la carpeta Spam, para descubrir todas sus señales de alerta.', 'In <b>step 3</b> you will investigate it like a detective, from the Spam folder, to uncover all its warning signs.')}</p>
      ${REMEMBER()}`,
      `<button class="m-big primary" type="button" data-act="mr-close">${L('Continuar', 'Continue')}</button>`,
    );
    return true;
  }

  return false;
}
