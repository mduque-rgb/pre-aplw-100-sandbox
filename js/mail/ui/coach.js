import { $m } from '../../shared/dom.js';
import { logHelp } from '../domain/mission.js';
import { mail } from '../state.js';

export const COACH = {
  to: {
    what: 'El destinatario es la persona que recibirá tu correo. Su dirección se escribe en el cuadro “To” (Para).',
    why: 'Si la dirección está incompleta o tiene un error, el correo no llega a nadie.',
  },
  sub: {
    t: 'Falta el asunto',
    what: 'El asunto es el título de tu correo: unas pocas palabras que dicen de qué trata.',
    why: 'Es lo primero que la otra persona ve en su bandeja, antes de abrir el mensaje. Un buen asunto ayuda a que lo abran, a que no lo confundan con correo basura y a encontrarlo después.',
    fix: 'Escribe el asunto en el cuadro “Subject” (Asunto). Ejemplo: Cena del domingo.',
  },
  body: {
    t: 'Tu mensaje está vacío',
    what: 'El mensaje es el texto de tu correo: lo que quieres decirle a la persona.',
    why: 'Un correo sin texto confunde a quien lo recibe, porque no sabe qué necesitas ni por qué le escribes.',
    fix: 'Escribe una o dos frases en el cuadro grande. Ejemplo: Hola Sofía, ¡sí, iré a cenar el domingo!',
  },
};

export const COACH_BTN = {
  to: { ok: 'Entendido' },
  sub: { ok: 'Agregar asunto', skip: 'Enviar sin asunto', skipAct: 'send-anyway-sub' },
  body: { ok: 'Escribir mensaje', skip: 'Enviar sin mensaje', skipAct: 'send-anyway-body' },
  att: { ok: 'Adjuntar archivo', skip: 'Enviar sin adjunto', skipAct: 'send-anyway-att' },
};

const coachHTML = (key, content) => {
  const buttons = COACH_BTN[key];
  return `<div class="mc-coach" role="alert">
    <p class="mc-soft">No te preocupes, a todos nos pasa.</p>
    <p class="mc-ct">${content.t}</p>
    <p><b>¿Qué es?</b> ${content.what}</p>
    <p><b>¿Por qué importa?</b> ${content.why}</p>
    <p><b>Qué hacer:</b> ${content.fix}</p>
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
  const missionStep = { sofia: 4, boss: 5, client: 6 }[compose && compose.dataset.mission];

  if (missionStep && mail.mission.step === missionStep && !mail.mission.done) {
    logHelp(
      missionStep,
      `Aviso antes de enviar: “${content.t}”`,
      { to: 'address', sub: 'subject', body: 'body', att: 'attach' }[key],
    );
  }

  const slot = $m(`mc-coach-${key}`);
  slot.innerHTML = coachHTML(key, content);
  slot.hidden = false;
  fieldOf(key).focus();
  slot.scrollIntoView({ block: 'nearest' });
}
