import { esc, $m } from '../../shared/dom.js';
import { L, tx } from '../../shared/i18n.js';
import { ic } from '../../shell/icons.js';
import { phishingById } from '../data/phishing.js';
import { logHelp } from '../domain/mission.js';
import { byId, mail } from '../state.js';

/** Reasons a learner can give for reporting an email: [key, Spanish, English]. */
export const MR_REASONS = [
  ['sender', 'No reconozco a quien lo envía', 'I don’t recognise the sender'],
  ['request', 'Me pide hacer algo', 'It asks me to do something'],
  ['urgency', 'Tiene prisa o una fecha límite', 'It is in a hurry or has a deadline'],
  ['good', 'Parece demasiado bueno para ser verdad', 'It seems too good to be true'],
  ['personal', 'Creo que me pide información personal', 'I think it asks for personal information'],
  ['mistake', 'Toqué el botón por error', 'I tapped the button by mistake'],
  ['other', 'Otro motivo', 'Another reason'],
];

const reasonLabel = (key) => {
  const reason = MR_REASONS.find(([value]) => value === key);
  return L(reason[1], reason[2]);
};

/** Why a real email is not phishing, for each reason the learner picked. */
function mrAnswer(key, message) {
  switch (key) {
    case 'sender':
      return L(
        `Lo envía <b>${esc(message.from)}</b> (${esc(message.addr)}). Es normal no reconocer a todos los remitentes. Lo importante es fijarte en lo que te pide: este correo no te pide tu contraseña, dinero ni datos privados.`,
        `It is from <b>${esc(message.from)}</b> (${esc(message.addr)}). It is normal not to recognise every sender. What matters is what it asks for: this email does not ask for your password, money or private data.`,
      );
    case 'request':
      return L(
        'Muchos correos reales piden algo sencillo, como ir a una clase, confirmar una cita o responder. La señal de alerta es que te pidan tu contraseña, datos del banco o dinero, y este correo no lo hace.',
        'Many real emails ask for something simple, like going to a class, confirming an appointment or replying. The warning sign is being asked for your password, bank details or money, and this email does not do that.',
      );
    case 'urgency':
      return L(
        'Un recordatorio con fecha u hora no es lo mismo que una amenaza. Los correos falsos te presionan con muy poco tiempo para asustarte; este no te amenaza con perder nada.',
        'A reminder with a date or time is not the same as a threat. Fake emails pressure you with very little time to scare you; this one does not threaten you with losing anything.',
      );
    case 'good':
      return L(
        'Algunos correos reales traen buenas noticias. Lo que delata a un correo falso es un premio que no pediste a cambio de tu contraseña o tus datos. Este correo no te pide nada de eso.',
        'Some real emails bring good news. What gives a fake email away is a prize you didn’t ask for in exchange for your password or data. This email asks for none of that.',
      );
    case 'personal':
      return L(
        `Vuelve a leerlo con calma: este correo no te pide tu contraseña, número de tarjeta ni fecha de nacimiento por correo.${/clinic/.test(message.addr) ? ' Pedirte que lleves tu tarjeta del seguro a una cita en persona no es lo mismo que pedirte sus datos por correo.' : ''}`,
        `Read it again calmly: this email does not ask for your password, card number or date of birth by email.${/clinic/.test(message.addr) ? ' Asking you to bring your insurance card to an in-person appointment is not the same as asking for its details by email.' : ''}`,
      );
    case 'mistake':
      return L(
        'No pasa nada: tocar el botón equivocado le pasa a todo el mundo. Lo importante es saber cómo corregirlo, y aquí abajo te lo explicamos.',
        'No problem: tapping the wrong button happens to everyone. What matters is knowing how to fix it, and we explain how below.',
      );
    default:
      return L(
        'Gracias por pensarlo. Recuerda las señales más comunes de un correo falso: un premio o una amenaza que no esperabas, mucha prisa, un remitente extraño y que te pidan tu contraseña o datos privados.',
        'Thanks for thinking about it. Remember the most common signs of a fake email: a prize or a threat you didn’t expect, a lot of hurry, a strange sender and being asked for your password or private data.',
      );
  }
}

export function showMisreport(message, phishDone, step = mail.mission.step) {
  mail.mr = { id: message.id, phishDone, step };
  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick mr-q" aria-hidden="true">?</span><h2 id="fb-h">${L('¿Por qué lo reportaste?', 'Why did you report it?')}</h2></div>
    <p>${L(`Reportaste como spam el correo de <b>${esc(message.from)}</b>: “${esc(message.subject)}”.`, `You reported the email from <b>${esc(message.from)}</b> as spam: “${esc(message.subject)}”.`)}</p>
    <p><b>${L('¿Qué te hizo pensar que este correo era falso (phishing)?', 'What made you think this email was fake (phishing)?')}</b> ${L('Puedes marcar varias respuestas.', 'You can tick several answers.')}</p>
    <div class="mr-opts">${MR_REASONS.map(([key]) => `<label class="mr-opt"><input type="checkbox" name="mr" value="${key}"><span>${reasonLabel(key)}</span></label>`).join('')}</div>
    <p class="wl-err" id="mr-err" role="alert" hidden>${L('Marca al menos una respuesta para continuar.', 'Tick at least one answer to continue.')}</p>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-next">${L('Continuar', 'Continue')}</button></div>
  </div>`;
  $m('m-fb').hidden = false;
  $m('m-fb').querySelector('input').focus();
}

function showPhishAnswer(message, picked) {
  const phish = phishingById(message.phishId);
  const seen = new Set(picked.flatMap((key) => (phish.reasons[key] ? phish.reasons[key].sign : [])));
  const missed = phish.signs.filter((_, index) => !seen.has(index));

  const item = (key) => {
    const reason = phish.reasons[key];
    const description = reason
      ? tx(reason.t)
      : key === 'mistake'
        ? L('Esta vez el botón fue el correcto: este correo sí es falso. Repórtalo siempre que veas las señales de abajo.', 'This time it was the right button: this email really is fake. Report it whenever you see the signs below.')
        : L('Gracias por pensarlo. Mira abajo las señales de alerta de este correo para reconocer otros parecidos.', 'Thanks for thinking about it. See the warning signs of this email below to recognise similar ones.');
    return `<li class="fb-item ${reason ? 'ok' : 'info'}"><span class="fb-ic" aria-hidden="true"></span><div><b>${reasonLabel(key)}</b><div>${description}</div></div></li>`;
  };

  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('spam')}</span><h2 id="fb-h">${L('¡Bien hecho! Este correo sí era falso', 'Well done! This email really was fake')}</h2></div>
    ${mail.mr.phishDone
    ? `<p class="fb-mission">${L('<b>¡Paso 3 completado!</b> El correo se fue a la carpeta Spam y ya no está en tu bandeja de entrada.', '<b>Step 3 complete!</b> The email went to the Spam folder and is no longer in your inbox.')}</p>`
    : `<p>${L('El correo se fue a la carpeta Spam y ya no está en tu bandeja de entrada.', 'The email went to the Spam folder and is no longer in your inbox.')}</p>`}
    <p>${L('Este tipo de correo se llama <b>phishing</b> (suplantación): alguien finge ser otra persona o empresa para robar tu información. Esto es lo que marcaste:', 'This kind of email is called <b>phishing</b>: someone pretends to be another person or company to steal your information. This is what you ticked:')}</p>
    <ul class="fb-list">${picked.map(item).join('')}</ul>
    ${missed.length
    ? `<p><b>${L('Otras señales de alerta en este correo:', 'Other warning signs in this email:')}</b></p><ul class="fb-list">${missed.map(([title, description]) => `<li class="fb-item warn"><span class="fb-ic" aria-hidden="true"></span><div><b>${tx(title)}</b><div>${tx(description)}</div></div></li>`).join('')}</ul>`
    : `<p class="fb-mission">${L('¡Encontraste todas las señales de alerta!', 'You found all the warning signs!')}</p>`}
    <p class="fb-retry"><b>${L('Recuerda:', 'Remember:')}</b> ${L('si un correo se ve así, no lo respondas, no toques sus enlaces y nunca compartas tu contraseña. Solo repórtalo como spam.', 'if an email looks like this, don’t reply, don’t tap its links and never share your password. Just report it as spam.')}</p>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-close">${L('Continuar', 'Continue')}</button></div>
  </div>`;

  const box = $m('m-fb').querySelector('.m-fb');
  box.scrollTop = 0;
  /** @type {HTMLElement} */ (box.querySelector('.m-big')).focus({ preventScroll: true });
}

export function showMisreportAnswer() {
  const message = byId(mail.mr.id);
  const picked = [...$m('m-fb').querySelectorAll('input[name=mr]:checked')].map((input) => /** @type {HTMLInputElement} */ (input).value);
  if (!picked.length) {
    $m('mr-err').hidden = false;
    return;
  }

  if (!mail.mission.done) {
    const list = (lang) => picked.map((key) => MR_REASONS.find(([value]) => value === key)[lang === 'es' ? 1 : 2].toLowerCase()).join('; ');
    logHelp(
      mail.mr.step,
      { es: `Explicaste por qué lo reportaste: ${list('es')}`, en: `You explained why you reported it: ${list('en')}` },
      '',
    );
  }

  if (message.warn) {
    showPhishAnswer(message, picked);
    return;
  }

  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick mr-q" aria-hidden="true">i</span><h2 id="fb-h">${L('Este correo era real', 'This email was real')}</h2></div>
    <p>${L(`El correo de <b>${esc(message.from)}</b> no es phishing. Esto es lo que conviene saber sobre lo que marcaste:`, `The email from <b>${esc(message.from)}</b> is not phishing. Here is what is worth knowing about what you ticked:`)}</p>
    <ul class="fb-list">${picked.map((key) => `<li class="fb-item info"><span class="fb-ic" aria-hidden="true"></span><div><b>${reasonLabel(key)}</b><div>${mrAnswer(key, message)}</div></div></li>`).join('')}</ul>
    <div class="mr-fix"><b>${L('¿Crees que te equivocaste? Así lo corriges:', 'Think you made a mistake? Here is how to fix it:')}</b>
      <ol>${L(
    '<li>Toca <b>Spam</b> en el menú de la izquierda.</li><li>En la fila de este correo, toca <b>Not spam</b> (o ábrelo y toca <b>Not spam</b>).</li><li>El correo volverá a tu bandeja de entrada.</li>',
    '<li>Tap <b>Spam</b> in the menu on the left.</li><li>In this email’s row, tap <b>Not spam</b> (or open it and tap <b>Not spam</b>).</li><li>The email will go back to your inbox.</li>',
  )}</ol></div>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-spam">${ic('spam')}${L('Ir a la carpeta Spam', 'Go to the Spam folder')}</button><button class="m-link" type="button" data-act="mr-close">${L('Cerrar', 'Close')}</button></div>
  </div>`;

  const box = $m('m-fb').querySelector('.m-fb');
  box.scrollTop = 0;
  /** @type {HTMLElement} */ (box.querySelector('.m-big')).focus({ preventScroll: true });
}
