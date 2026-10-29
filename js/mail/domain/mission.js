import { ic } from '../../shell/icons.js';
import { CONTACTS } from '../contacts.js';
import { DELETE_GOAL, READ_GOAL } from '../mission-goals.js';
import { mail, phishMsg, sofiaMsg } from '../state.js';
import { mailToast } from '../ui/toast.js';
import { updateLog, withHelp, withIssue, withRead, withStep, withTry } from './mission-state.js';

export const logTry = (step) => {
  mail.mission = withTry(mail.mission, step);
};

export const logIssue = (step, text) => {
  mail.mission = withIssue(mail.mission, step, text);
};

export const logHelp = (step, text, category) => {
  mail.mission = withHelp(mail.mission, step, text, category);
};

export function missionRead(message) {
  let mission = mail.mission;
  if (mission.step !== 1 || message.mine || mission.read.has(message.id)) return;

  mission = withRead(mission, message.id);
  if (mission.read.size >= READ_GOAL) {
    mission = updateLog(withStep(mission, 2), 1, { tries: 1 });
    mail.mission = mission;
    mailToast('¡Paso 1 completado! Toca “Back” para ver el siguiente paso.');
  } else {
    mail.mission = mission;
    mailToast(`Leíste ${mission.read.size} de ${READ_GOAL} correos nuevos`);
  }
}

export function missionHTML() {
  const mission = mail.mission;

  if (mission.done) {
    return `<div class="m-mission done"><p><b>¡Práctica completada!</b> Leíste tus correos nuevos, borraste los que no necesitabas, reportaste un correo falso, respondiste a Sofía, le pediste un día libre a tu jefa , le enviaste una factura a un cliente y cerraste tu sesión.</p><button class="m-big primary" type="button" data-act="report">Ver mi informe</button><button class="m-tbtn" type="button" data-act="mission-restart">Empezar de nuevo</button></div>`;
  }

  if (mission.step === 1) {
    return `<div class="m-mission"><p><b>Paso 1 de 7: Lee tus correos nuevos.</b> Los correos que no has leído aparecen en <b>negrita</b>. Toca uno para abrirlo y leerlo, y luego toca “Back” para volver.</p><span class="m-prog">Leídos: ${mission.read.size} de ${READ_GOAL}</span></div>`;
  }

  if (mission.step === 2) {
    return `<div class="m-mission"><p><b>Paso 2 de 7: Borra ${DELETE_GOAL} correos que ya no necesitas.</b> Toca el botón “Delete” en la fila del correo, o ábrelo y toca “Delete”. No borres el de Sofía: ¡lo vas a responder!</p><span class="m-prog">Borrados: ${mission.deleted.size} de ${DELETE_GOAL}</span></div>`;
  }

  if (mission.step === 3) {
    const phish = phishMsg();
    const where = !phish
      ? 'Ese correo ya no está. Toca “Reset practice inbox” para traerlo de vuelta.'
      : phish.folder === 'trash'
        ? 'Lo borraste y ahora está en la Papelera (Trash). Ábrelo, toca “Restore” y luego repórtalo desde tu bandeja.'
        : 'Toca <b>“Report spam”</b> (Reportar spam) en su fila, o ábrelo y toca “Report spam”. No lo respondas ni toques nada dentro del correo.';
    return `<div class="m-mission"><p><b>Paso 3 de 7: Reporta el correo falso.</b> En tu bandeja hay un correo trampa (<i>phishing</i>) que quiere robar tu información. Pistas para encontrarlo: dice que ganaste un premio, tiene mucha prisa y te pide tu contraseña. ${where}</p>${phish ? '<button class="m-tbtn" type="button" data-act="mission-phish">Mostrarme cuál es</button>' : ''}</div>`;
  }

  const sofia = sofiaMsg();
  const where = !sofia
    ? 'Su correo ya no está. Toca “Reset practice inbox” para traerlo de vuelta.'
    : sofia.folder === 'trash'
      ? 'Su correo está en la Papelera (Trash), pero puedes abrirlo y responder igual.'
      : 'Ábrelo y toca “Reply” (Responder).';

  if (mission.step === 4) {
    return `<div class="m-mission"><p><b>Paso 4 de 7: Responde al correo de Sofía</b> y dile que sí irás a cenar el domingo. ${where}</p>${sofia ? `<button class="m-big primary" type="button" data-act="mission-open">${ic('reply')}Abrir el correo de Sofía</button>` : ''}</div>`;
  }

  const signOut = document.querySelector('#mail-app [data-act=signout]');
  if (signOut) signOut.classList.toggle('hl', mission.step === 7 && !mission.done);

  if (mission.step === 7) {
    return '<div class="m-mission"><p><b>Paso 7 de 7: Cierra tu sesión.</b> Cuando termines de usar tu correo, cierra tu sesión (<i>Sign out</i>), sobre todo en una tableta o computadora que usan otras personas. Así nadie más puede leer tus correos. Toca <b>“Sign out”</b> arriba a la derecha y confirma que quieres salir.</p></div>';
  }

  if (mission.step === 5) {
    return `<div class="m-mission"><p><b>Paso 5 de 7: Pide un día libre a tu jefa.</b> Tu jefa es <b>${CONTACTS.boss.name}</b> (${CONTACTS.boss.email}). Toca “Compose” (Redactar) y escribe un correo nuevo con: un asunto claro, un saludo formal, qué día necesitas libre y por qué, y una despedida formal con tu nombre.</p><button class="m-big primary" type="button" data-act="mission-boss">${ic('pencil')}Escribir a mi jefa</button></div>`;
  }

  return `<div class="m-mission"><p><b>Paso 6 de 7: Envía una factura a un cliente.</b> Tu cliente es <b>${CONTACTS.client.name}</b> (${CONTACTS.client.email}). Toca “Compose” (Redactar) y escríbele un correo nuevo para enviarle la <b>factura número 1045</b>. Para adjuntarla, toca el botón <b>Attach</b> (Adjuntar, con el clip) y elige el archivo. ¡Fíjate bien que sea la factura correcta!</p><button class="m-big primary" type="button" data-act="mission-client">${ic('clip')}Escribir a mi cliente</button></div>`;
}
