import { $m } from '../../shared/dom.js';
import { L } from '../../shared/i18n.js';
import { logHelp } from '../domain/mission.js';
import { mail } from '../state.js';
import { STEP } from '../mission-steps.js';

/** Explanations shown before sending when something important is missing. Built on demand so they follow the language. */
export const COACH = {
  get to() {
    return {
      what: L('El destinatario es la persona que recibirá tu correo. Su dirección se escribe en el cuadro “To” (Para).', 'The recipient is the person who will receive your email. Their address goes in the “To” box.'),
      why: L('Si la dirección está incompleta o tiene un error, el correo no llega a nadie.', 'If the address is incomplete or has a mistake, the email reaches no one.'),
    };
  },
  get sub() {
    return {
      t: L('Falta el asunto', 'Missing subject'),
      what: L('El asunto es el título de tu correo: unas pocas palabras que dicen de qué trata.', 'The subject is the title of your email: a few words that say what it is about.'),
      why: L('Es lo primero que la otra persona ve en su bandeja, antes de abrir el mensaje. Un buen asunto ayuda a que lo abran, a que no lo confundan con correo basura y a encontrarlo después.', 'It is the first thing the other person sees in their inbox, before opening the message. A good subject helps them open it, not mistake it for junk mail, and find it later.'),
      fix: L('Escribe el asunto en el cuadro “Subject” (Asunto). Ejemplo: Cena del domingo.', 'Type the subject in the “Subject” box. Example: Sunday dinner.'),
    };
  },
  get body() {
    return {
      t: L('Tu mensaje está vacío', 'Your message is empty'),
      what: L('El mensaje es el texto de tu correo: lo que quieres decirle a la persona.', 'The message is the text of your email: what you want to tell the person.'),
      why: L('Un correo sin texto confunde a quien lo recibe, porque no sabe qué necesitas ni por qué le escribes.', 'An email without text confuses the person who gets it, because they do not know what you need or why you are writing.'),
      fix: L('Escribe una o dos frases en el cuadro grande. Ejemplo: Hola Sofía, ¡sí, iré a cenar el domingo!', 'Write one or two sentences in the big box. Example: Hi Sofía, yes, I will come for dinner on Sunday!'),
    };
  },
};

const coachButtons = (key) => ({
  to: { ok: L('Entendido', 'Got it') },
  sub: { ok: L('Agregar asunto', 'Add subject'), skip: L('Enviar sin asunto', 'Send without subject'), skipAct: 'send-anyway-sub' },
  body: { ok: L('Escribir mensaje', 'Write message'), skip: L('Enviar sin mensaje', 'Send without message'), skipAct: 'send-anyway-body' },
  att: { ok: L('Adjuntar archivo', 'Attach file'), skip: L('Enviar sin adjunto', 'Send without attachment'), skipAct: 'send-anyway-att' },
}[key]);

const coachHTML = (key, content) => {
  const buttons = coachButtons(key);
  return `<div class="mc-coach" role="alert">
    <p class="mc-soft">${L('No te preocupes, a todos nos pasa.', 'Don’t worry, it happens to everyone.')}</p>
    <p class="mc-ct">${content.t}</p>
    <p><b>${L('¿Qué es?', 'What is it?')}</b> ${content.what}</p>
    <p><b>${L('¿Por qué importa?', 'Why does it matter?')}</b> ${content.why}</p>
    <p><b>${L('Qué hacer:', 'What to do:')}</b> ${content.fix}</p>
    <div class="mc-cbtns"><button class="m-big primary" type="button" data-act="coach-ok" data-k="${key}">${buttons.ok}</button>${buttons.skip ? `<button class="m-link" type="button" data-act="${buttons.skipAct}">${buttons.skip}</button>` : ''}</div>
  </div>`;
};

export const fieldOf = (key) => $m(
  key === 'to' ? 'mc-to' : key === 'sub' ? 'mc-sub' : key === 'att' ? 'mc-attach' : 'mc-body',
);

export function hideCoach(key) {
  const slot = $m(`mc-coach-${key}`);
  if (!slot) return;
  slot.hidden = true;
  slot.innerHTML = '';
}

export function showCoach(key, content) {
  const compose = $m('m-compose');
  const missionStep = { sofia: STEP.REPLY_SOFIA, boss: STEP.ASK_DAY_OFF, client: STEP.SEND_INVOICE }[compose && compose.dataset.mission];

  if (missionStep && mail.mission.step === missionStep && !mail.mission.done) {
    logHelp(
      missionStep,
      { es: `Aviso antes de enviar: “${content.t}”`, en: `Warning before sending: “${content.t}”` },
      { to: 'address', sub: 'subject', body: 'body', att: 'attach' }[key],
    );
  }

  const slot = $m(`mc-coach-${key}`);
  slot.innerHTML = coachHTML(key, content);
  slot.hidden = false;
  fieldOf(key).focus();
  slot.scrollIntoView({ block: 'nearest' });
}
