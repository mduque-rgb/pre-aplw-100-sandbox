import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { CONTACTS } from '../contacts.js';
import { addMessage } from '../domain/mailbox.js';
import { ATT_MENTION_RE, fold } from '../domain/writing-checks.js';
import { mail } from '../state.js';
import { drawAtts, togglePicker } from './attachments.js';
import { COACH, hideCoach, showCoach } from './coach.js';
import { composeEl } from './compose-dom.js';
import { showFeedback } from './feedback.js';
import { drawMain, drawSide } from './render.js';

export const ownText = (body) => body.split(/\n\s*(?:On .+ wrote:|-{5,} Forwarded message)/)[0].trim();

export function replyDraft(message) {
  const quoted = message.body.split('\n').map((line) => `> ${line}`).join('\n');
  return {
    title: 'Reply',
    to: message.addr,
    subject: /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`,
    body: `\n\nOn ${message.date}, ${message.mine ? 'I' : message.from} wrote:\n${quoted}`,
    focus: 'body',
    kind: 'reply',
  };
}

export function forwardDraft(message) {
  return {
    title: 'Forward',
    to: '',
    subject: /^fwd:/i.test(message.subject) ? message.subject : `Fwd: ${message.subject}`,
    body: `\n\n---------- Forwarded message ----------\nFrom: ${message.from} <${message.addr}>\nDate: ${message.date}, ${message.time}\nSubject: ${message.subject}\nTo: ${message.to}\n\n${message.body}`,
    focus: 'to',
    kind: 'forward',
    atts: message.atts ? [...message.atts] : [],
  };
}

export function openCompose(draft) {
  const compose = composeEl();
  compose.dataset.skipSub = '';
  compose.dataset.skipBody = '';
  compose.dataset.skipAtt = '';
  compose.dataset.kind = draft.kind || 'new';
  compose.dataset.mission = draft.mission || '';
  compose._atts = draft.atts ? [...draft.atts] : [];

  compose.innerHTML = `<div class="mc-head"><b>${draft.title || 'New message'}</b><button class="m-tx" type="button" data-act="cx" aria-label="Close">${ic('x')}</button></div>
    ${draft.mission === 'client' ? `<div class="mc-mission"><b>Paso 6 de 7:</b> envía a tu cliente, ${CONTACTS.client.name}, la <b>factura número 1045</b>. En “To” escribe <b>${CONTACTS.client.email}</b>. Tu correo debe tener: <b>un asunto</b> (ej. Factura n.º 1045), <b>un saludo formal</b> (ej. Estimado Carlos:), una frase que diga que <b>le adjuntas la factura</b> y <b>una despedida formal</b>. Para adjuntarla, toca <b>Attach</b> (el clip), abajo, y elige el archivo correcto.</div>` : ''}
    ${draft.mission === 'boss' ? `<div class="mc-mission"><b>Paso 5 de 7:</b> escribe a tu jefa, ${CONTACTS.boss.name}, para pedirle un día libre. En “To” escribe <b>${CONTACTS.boss.email}</b>. Tu correo debe tener: <b>un asunto</b> (ej. Solicitud de día libre), <b>un saludo formal</b> (ej. Estimada Laura:), <b>qué día necesitas libre</b> y por qué, y <b>una despedida formal</b> (ej. Saludos cordiales,) con tu nombre. Cuando termines, toca <b>Send</b>.</div>` : ''}
    ${draft.mission === 'sofia' ? '<div class="mc-mission"><b>Paso 4 de 7:</b> escribe tu respuesta a Sofía en el cuadro grande. Tu respuesta debe tener <b>un saludo</b>, <b>tu respuesta a su pregunta</b> (¿irás a cenar el domingo?) y <b>una despedida</b>. Su correo aparece abajo, y “To” y “Subject” ya están llenos. Cuando termines, toca <b>Send</b>.</div>' : ''}
    <label class="mc-row"><span>To</span><input id="mc-to" type="text" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <div class="mc-slot" id="mc-coach-to" hidden></div>
    <label class="mc-row"><span>Subject</span><input id="mc-sub" type="text" autocomplete="off"></label>
    <div class="mc-slot" id="mc-coach-sub" hidden></div>
    <textarea id="mc-body" aria-label="Message"></textarea>
    <div class="mc-slot" id="mc-coach-body" hidden></div>
    <div class="mc-atts" id="mc-atts" aria-label="Attachments"></div>
    <div class="mc-picker" id="mc-picker" hidden></div>
    <div class="mc-slot" id="mc-coach-att" hidden></div>
    <div class="mc-foot"><button class="m-big primary" type="button" data-act="send">${ic('sent')}Send</button><button class="m-big" type="button" id="mc-attach" data-act="attach" aria-expanded="false">${ic('clip')}Attach</button><button class="m-link" type="button" data-act="cx">Discard</button></div>`;

  drawAtts();
  const to = /** @type {HTMLInputElement} */ ($m('mc-to'));
  const subject = /** @type {HTMLInputElement} */ ($m('mc-sub'));
  const body = /** @type {HTMLTextAreaElement} */ ($m('mc-body'));
  to.value = draft.to || '';
  subject.value = draft.subject || '';
  body.value = draft.body || '';

  [['mc-to', 'to'], ['mc-sub', 'sub'], ['mc-body', 'body']].forEach(([id, key]) => {
    $m(id).addEventListener('input', () => {
      hideCoach(key);
      if (key === 'sub') compose.dataset.skipSub = '';
      if (key === 'body') compose.dataset.skipBody = '';
    });
  });

  compose.hidden = false;
  if (draft.focus === 'body') {
    body.focus();
    body.setSelectionRange(0, 0);
  } else {
    to.focus();
  }
}

function checkTo(value) {
  const parts = value.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return { t: 'Falta el destinatario', fix: 'Escribe a quién enviarás el mensaje. Ejemplo: sofia.lopez@example.com' };

  for (const part of parts) {
    const quoted = esc(part);
    if (/\s/.test(part)) return { t: 'Hay un espacio en la dirección', fix: `Hay un espacio dentro de “${quoted}”. Una dirección no lleva espacios. Bórralo, o separa varias direcciones con comas.` };
    if (!part.includes('@')) return { t: 'Falta el símbolo @', fix: `A “${quoted}” le falta el @. Una dirección se ve así: nombre@correo.com` };
    if (!/^[^@]+@[^@]+\.[^@.]{2,}$/.test(part)) return { t: 'La dirección parece incompleta', fix: `“${quoted}” debe tener un nombre, el @ y un final como .com. Ejemplo: nombre@correo.com` };
  }

  return null;
}

export function sendMail() {
  const compose = composeEl();
  const to = /** @type {HTMLInputElement} */ ($m('mc-to'));
  const subject = /** @type {HTMLInputElement} */ ($m('mc-sub'));
  const body = /** @type {HTMLTextAreaElement} */ ($m('mc-body'));
  const kind = compose.dataset.kind;
  const problem = checkTo(to.value);
  if (problem) {
    showCoach('to', { ...COACH.to, ...problem });
    return;
  }

  if (!subject.value.trim() && !compose.dataset.skipSub) {
    showCoach('sub', COACH.sub);
    return;
  }

  const own = ownText(body.value);
  if (kind !== 'forward' && !own && !compose.dataset.skipBody) {
    showCoach('body', COACH.body);
    return;
  }

  const mentions = ATT_MENTION_RE.test(fold(own));
  if (!compose._atts.length && !compose.dataset.skipAtt && (mentions || compose.dataset.mission === 'client')) {
    togglePicker(false);
    showCoach('att', {
      t: '¿Olvidaste adjuntar el archivo?',
      what: 'Un archivo adjunto es un documento, como una factura o una foto, que viaja junto con tu correo.',
      why: mentions
        ? 'Tu mensaje dice que envías un archivo, pero no adjuntaste ninguno. Quien lo reciba no encontrará el documento.'
        : 'Esta práctica pide enviarle la factura a tu cliente, pero tu correo no lleva ningún archivo.',
      fix: 'Toca “Adjuntar archivo” aquí, o el botón <b>Attach</b> (el clip) abajo, y elige el archivo.',
    });
    return;
  }

  const now = new Date();
  const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() < 12 ? 'AM' : 'PM'}`;
  /** @type {import('../types.js').MailMessage} */
  const message = {
    id: mail.nextId++,
    from: 'Me',
    addr: mail.addr,
    to: to.value.trim(),
    subject: subject.value.trim() || '(no subject)',
    date: 'Oct 13',
    time,
    body: body.value,
    atts: [...compose._atts],
    folder: 'sent',
    unread: false,
    starred: false,
    mine: true,
  };

  mail.msgs = addMessage(mail.msgs, message);
  closeCompose();
  drawMain();
  drawSide();
  showFeedback(message, kind, own);
}

export function closeCompose() {
  const compose = composeEl();
  if (!compose) return;
  compose.hidden = true;
  compose.innerHTML = '';
}

export function composeNew() {
  const mission = mail.mission;
  openCompose({
    focus: 'to',
    mission: mission.done ? '' : mission.step === 5 ? 'boss' : mission.step === 6 ? 'client' : '',
  });
}

