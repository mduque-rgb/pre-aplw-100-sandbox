import { ic } from '../../shell/icons.js';
import { L, tx } from '../../shared/i18n.js';
import { CONTACTS } from '../contacts.js';
import { phishingById } from '../data/phishing.js';
import { DELETE_GOAL, READ_GOAL } from '../mission-goals.js';
import { mail, phishMsg, sofiaMsg } from '../state.js';
import { mailToast } from '../ui/toast.js';
import { updateLog, withHelp, withIssue, withRead, withStep, withTry } from './mission-state.js';
import { STEP } from '../mission-steps.js';

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
  if (mission.step !== STEP.READ_NEW || message.mine || mission.read.has(message.id)) return;

  mission = withRead(mission, message.id);
  if (mission.read.size >= READ_GOAL) {
    mission = updateLog(withStep(mission, STEP.DELETE_OLD), STEP.READ_NEW, { tries: 1 });
    mail.mission = mission;
    mailToast(L('¡Paso 1 completado! Toca “Back” para ver el siguiente paso.', 'Step 1 complete! Tap “Back” to see the next step.'));
  } else {
    mail.mission = mission;
    mailToast(L(`Leíste ${mission.read.size} de ${READ_GOAL} correos nuevos`, `You read ${mission.read.size} of ${READ_GOAL} new emails`));
  }
}

/**
 * Mission box for the inbox. While the practice is not finished it also offers
 * the progress report, so learners who stop early can still see it.
 */
export function missionHTML() {
  const html = missionBody();
  const mission = mail.mission;
  if (mission.done) return html;

  const replayNote = mission.replay
    ? `<p class="m-replay">${L('Práctica extra: al terminar este paso volverás a donde estabas.', 'Extra practice: when you finish this step you will return to where you were.')}</p>`
    : '';
  const progress = `<button class="m-link m-progress" type="button" data-act="report">${ic('starred')}${L('Ver mi avance', 'See my progress')}</button>`;
  return html.replace(/<\/div>$/, `${replayNote}${progress}</div>`);
}

function missionBody() {
  const mission = mail.mission;
  const { boss, client } = CONTACTS;

  if (mission.done) {
    return `<div class="m-mission done"><p>${L(
      '<b>¡Práctica completada!</b> Leíste tus correos nuevos, borraste los que no necesitabas, reportaste un correo falso, respondiste a Sofía, le pediste un día libre a tu jefa, le enviaste una factura a un cliente y cerraste tu sesión.',
      '<b>Practice complete!</b> You read your new emails, deleted the ones you didn’t need, reported a fake email, replied to Sofía, asked your manager for a day off, sent an invoice to a client and signed out.',
    )}</p><button class="m-big primary" type="button" data-act="report">${L('Ver mi informe', 'See my report')}</button><button class="m-tbtn" type="button" data-act="mission-restart">${L('Empezar de nuevo', 'Start over')}</button></div>`;
  }

  if (mission.step === STEP.READ_NEW) {
    return `<div class="m-mission"><p>${L(
      '<b>Paso 1 de 7: Lee tus correos nuevos.</b> Los correos que no has leído aparecen en <b>negrita</b>. Toca uno para abrirlo y leerlo, y luego toca “Back” para volver.',
      '<b>Step 1 of 7: Read your new emails.</b> Emails you haven’t read are shown in <b>bold</b>. Tap one to open and read it, then tap “Back” to return.',
    )}</p><span class="m-prog">${L('Leídos', 'Read')}: ${mission.read.size} ${L('de', 'of')} ${READ_GOAL}</span></div>`;
  }

  if (mission.step === STEP.DELETE_OLD) {
    return `<div class="m-mission"><p>${L(
      `<b>Paso 2 de 7: Borra ${DELETE_GOAL} correos que ya no necesitas.</b> Toca el botón “Delete” en la fila del correo, o ábrelo y toca “Delete”. No borres el de Sofía: ¡lo vas a responder!`,
      `<b>Step 2 of 7: Delete ${DELETE_GOAL} emails you no longer need.</b> Tap the “Delete” button in the email’s row, or open it and tap “Delete”. Don’t delete Sofía’s: you are going to reply to it!`,
    )}</p><span class="m-prog">${L('Borrados', 'Deleted')}: ${mission.deleted.size} ${L('de', 'of')} ${DELETE_GOAL}</span></div>`;
  }

  if (mission.step === STEP.REPORT_PHISH) {
    const phish = phishMsg();
    const where = !phish
      ? L('Ese correo ya no está. Toca “Reset practice inbox” para traerlo de vuelta.', 'That email is gone. Tap “Reset practice inbox” to bring it back.')
      : phish.folder === 'trash'
        ? L('Lo borraste y ahora está en la Papelera (Trash). Ábrelo, toca “Restore” y luego repórtalo desde tu bandeja.', 'You deleted it and now it is in the Trash. Open it, tap “Restore” and then report it from your inbox.')
        : L('Toca <b>“Report spam”</b> (Reportar spam) en su fila, o ábrelo y toca “Report spam”. No lo respondas ni toques nada dentro del correo.', 'Tap <b>“Report spam”</b> in its row, or open it and tap “Report spam”. Don’t reply or tap anything inside the email.');
    const clues = tx(phishingById(phish?.phishId).clues);
    return `<div class="m-mission"><p>${L(
      `<b>Paso 3 de 7: Reporta el correo falso.</b> En tu bandeja hay un correo trampa (<i>phishing</i>) que quiere robar tu información. Pistas para encontrarlo: ${clues}. ${where}`,
      `<b>Step 3 of 7: Report the fake email.</b> Your inbox has a trap email (<i>phishing</i>) that wants to steal your information. Clues to find it: ${clues}. ${where}`,
    )}</p>${phish ? `<button class="m-tbtn" type="button" data-act="mission-phish">${L('Mostrarme cuál es', 'Show me which one')}</button>` : ''}</div>`;
  }

  const sofia = sofiaMsg();
  const where = !sofia
    ? L('Su correo ya no está. Toca “Reset practice inbox” para traerlo de vuelta.', 'Her email is gone. Tap “Reset practice inbox” to bring it back.')
    : sofia.folder === 'trash'
      ? L('Su correo está en la Papelera (Trash), pero puedes abrirlo y responder igual.', 'Her email is in the Trash, but you can still open it and reply.')
      : L('Ábrelo y toca “Reply” (Responder).', 'Open it and tap “Reply”.');

  if (mission.step === STEP.REPLY_SOFIA) {
    return `<div class="m-mission"><p>${L(
      `<b>Paso 4 de 7: Responde al correo de Sofía</b> y dile que sí irás a cenar el domingo. ${where}`,
      `<b>Step 4 of 7: Reply to Sofía’s email</b> and tell her you will come for dinner on Sunday. ${where}`,
    )}</p>${sofia ? `<button class="m-big primary" type="button" data-act="mission-open">${ic('reply')}${L('Abrir el correo de Sofía', 'Open Sofía’s email')}</button>` : ''}</div>`;
  }

  const signOut = document.querySelector('#mail-app [data-act=signout]');
  if (signOut) signOut.classList.toggle('hl', mission.step === STEP.SIGN_OUT && !mission.done);

  if (mission.step === STEP.SIGN_OUT) {
    return `<div class="m-mission"><p>${L(
      '<b>Paso 7 de 7: Cierra tu sesión.</b> Cuando termines de usar tu correo, cierra tu sesión (<i>Sign out</i>), sobre todo en una tableta o computadora que usan otras personas. Así nadie más puede leer tus correos. Toca <b>“Sign out”</b> arriba a la derecha y confirma que quieres salir.',
      '<b>Step 7 of 7: Sign out.</b> When you finish using your email, sign out, especially on a tablet or computer other people use. That way nobody else can read your emails. Tap <b>“Sign out”</b> at the top right and confirm.',
    )}</p></div>`;
  }

  if (mission.step === STEP.ASK_DAY_OFF) {
    return `<div class="m-mission"><p>${L(
      `<b>Paso 5 de 7: Pide un día libre a tu jefa.</b> Tu jefa es <b>${boss.name}</b> (${boss.email}). Toca “Compose” (Redactar) y escribe un correo nuevo con: un asunto claro, un saludo formal, qué día necesitas libre y por qué, y una despedida formal con tu nombre.`,
      `<b>Step 5 of 7: Ask your manager for a day off.</b> Your manager is <b>${boss.name}</b> (${boss.email}). Tap “Compose” and write a new email with: a clear subject, a formal greeting, which day you need off and why, and a formal closing with your name.`,
    )}</p><button class="m-big primary" type="button" data-act="mission-boss">${ic('pencil')}${L('Escribir a mi jefa', 'Write to my manager')}</button></div>`;
  }

  return `<div class="m-mission"><p>${L(
    `<b>Paso 6 de 7: Envía una factura a un cliente.</b> Tu cliente es <b>${client.name}</b> (${client.email}). Toca “Compose” (Redactar) y escríbele un correo nuevo para enviarle la <b>factura número 1045</b>. Para adjuntarla, toca el botón <b>Attach</b> (Adjuntar, con el clip) y elige el archivo. ¡Fíjate bien que sea la factura correcta!`,
    `<b>Step 6 of 7: Send an invoice to a client.</b> Your client is <b>${client.name}</b> (${client.email}). Tap “Compose” and write a new email to send <b>invoice number 1045</b>. To attach it, tap the <b>Attach</b> button (the paperclip) and choose the file. Make sure it is the right invoice!`,
  )}</p><button class="m-big primary" type="button" data-act="mission-client">${ic('clip')}${L('Escribir a mi cliente', 'Write to my client')}</button></div>`;
}
