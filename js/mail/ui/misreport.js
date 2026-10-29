import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { logHelp } from '../domain/mission.js';
import { byId, mail } from '../state.js';

export const MR_REASONS = [
  ['sender', 'No reconozco a quien lo envía'],
  ['request', 'Me pide hacer algo'],
  ['urgency', 'Tiene prisa o una fecha límite'],
  ['good', 'Parece demasiado bueno para ser verdad'],
  ['personal', 'Creo que me pide información personal'],
  ['mistake', 'Toqué el botón por error'],
  ['other', 'Otro motivo'],
];

const PHISH_REASON = {
  sender: { sign: [0], t: '¡Bien visto! La dirección <b>claim-now@prize-winner-center.example</b> no es de nadie que conozcas ni de una empresa real.' },
  request: { sign: [4], t: 'Así es: te pide responder con tu contraseña y tu fecha de nacimiento. Eso es justo lo que buscan los estafadores.' },
  urgency: { sign: [3], t: 'Exacto: solo 24 horas y “LAST chance” (última oportunidad). La prisa es para que actúes sin pensar con calma.' },
  good: { sign: [1, 2], t: '¡Correcto! Un premio de $500 que no pediste es una de las trampas más comunes.' },
  personal: { sign: [4], t: '¡Correcto! Te pide tu contraseña y tu fecha de nacimiento. Ninguna empresa real te pide eso por correo.' },
};

const PHISH_SIGNS = [
  ['Un remitente que no conoces', 'La dirección <b>claim-now@prize-winner-center.example</b> no es de nadie que conozcas ni de una empresa real.'],
  ['Un premio que no pediste', 'Dice que ganaste una tarjeta de regalo de $500, pero no participaste en ningún concurso.'],
  ['Mayúsculas y muchos “!!!”', 'El asunto grita “YOU WON” (¡GANASTE!) para emocionarte y que no pienses con calma.'],
  ['Mucha prisa', 'Te da solo 24 horas y dice que es tu “LAST chance” (última oportunidad), para que actúes rápido.'],
  ['Pide datos privados', 'Te pide tu contraseña y tu fecha de nacimiento. Ninguna empresa real te pide eso por correo.'],
];

function mrAnswer(key, message) {
  switch (key) {
    case 'sender':
      return `Lo envía <b>${esc(message.from)}</b> (${esc(message.addr)}). Es normal no reconocer a todos los remitentes. Lo importante es fijarte en lo que te pide: este correo no te pide tu contraseña, dinero ni datos privados.`;
    case 'request':
      return 'Muchos correos reales piden algo sencillo, como ir a una clase, confirmar una cita o responder. La señal de alerta es que te pidan tu contraseña, datos del banco o dinero, y este correo no lo hace.';
    case 'urgency':
      return 'Un recordatorio con fecha u hora no es lo mismo que una amenaza. El correo falso de esta bandeja decía “24 hours” y “LAST chance” para asustarte; este no te amenaza con perder nada.';
    case 'good':
      return 'Algunos correos reales traen buenas noticias. Lo que delata a un correo falso es un premio que no pediste a cambio de tu contraseña o tus datos. Este correo no te pide nada de eso.';
    case 'personal':
      return `Vuelve a leerlo con calma: este correo no te pide tu contraseña, número de tarjeta ni fecha de nacimiento por correo.${/clinic/.test(message.addr) ? ' Pedirte que lleves tu tarjeta del seguro a una cita en persona no es lo mismo que pedirte sus datos por correo.' : ''}`;
    case 'mistake':
      return 'No pasa nada: tocar el botón equivocado le pasa a todo el mundo. Lo importante es saber cómo corregirlo, y aquí abajo te lo explicamos.';
    default:
      return 'Gracias por pensarlo. Recuerda las señales más comunes de un correo falso: un premio o una amenaza que no esperabas, mucha prisa, un remitente extraño y que te pidan tu contraseña o datos privados.';
  }
}

export function showMisreport(message, phishDone) {
  mail.mr = { id: message.id, phishDone };
  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick mr-q" aria-hidden="true">?</span><h2 id="fb-h">¿Por qué lo reportaste?</h2></div>
    <p>Reportaste como spam el correo de <b>${esc(message.from)}</b>: “${esc(message.subject)}”.</p>
    <p><b>¿Qué te hizo pensar que este correo era falso (phishing)?</b> Puedes marcar varias respuestas.</p>
    <div class="mr-opts">${MR_REASONS.map(([key, label]) => `<label class="mr-opt"><input type="checkbox" name="mr" value="${key}"><span>${label}</span></label>`).join('')}</div>
    <p class="wl-err" id="mr-err" role="alert" hidden>Marca al menos una respuesta para continuar.</p>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-next">Continuar</button></div>
  </div>`;
  $m('m-fb').hidden = false;
  $m('m-fb').querySelector('input').focus();
}

function showPhishAnswer(message, picked) {
  const seen = new Set(picked.flatMap((key) => (PHISH_REASON[key] ? PHISH_REASON[key].sign : [])));
  const missed = PHISH_SIGNS.filter((_, index) => !seen.has(index));

  const item = (key) => {
    const reason = PHISH_REASON[key];
    const label = MR_REASONS.find(([value]) => value === key)[1];
    const description = reason
      ? reason.t
      : key === 'mistake'
        ? 'Esta vez el botón fue el correcto: este correo sí es falso. Repórtalo siempre que veas las señales de abajo.'
        : 'Gracias por pensarlo. Mira abajo las señales de alerta de este correo para reconocer otros parecidos.';
    return `<li class="fb-item ${reason ? 'ok' : 'info'}"><span class="fb-ic" aria-hidden="true"></span><div><b>${label}</b><div>${description}</div></div></li>`;
  };

  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('spam')}</span><h2 id="fb-h">¡Bien hecho! Este correo sí era falso</h2></div>
    ${mail.mr.phishDone ? '<p class="fb-mission"><b>¡Paso 3 completado!</b> El correo se fue a la carpeta Spam y ya no está en tu bandeja de entrada.</p>' : '<p>El correo se fue a la carpeta Spam y ya no está en tu bandeja de entrada.</p>'}
    <p>Este tipo de correo se llama <b>phishing</b> (suplantación): alguien finge darte algo bueno para robar tu información. Esto es lo que marcaste:</p>
    <ul class="fb-list">${picked.map(item).join('')}</ul>
    ${missed.length
      ? `<p><b>Otras señales de alerta en este correo:</b></p><ul class="fb-list">${missed.map(([title, description]) => `<li class="fb-item warn"><span class="fb-ic" aria-hidden="true"></span><div><b>${title}</b><div>${description}</div></div></li>`).join('')}</ul>`
      : '<p class="fb-mission">¡Encontraste todas las señales de alerta!</p>'}
    <p class="fb-retry"><b>Recuerda:</b> si un correo se ve así, no lo respondas, no toques sus enlaces y nunca compartas tu contraseña. Solo repórtalo como spam.</p>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-close">Continuar</button></div>
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
    logHelp(
      mail.mission.step,
      `Explicaste por qué lo reportaste: ${picked.map((key) => MR_REASONS.find(([value]) => value === key)[1].toLowerCase()).join('; ')}`,
      '',
    );
  }

  if (message.warn) {
    showPhishAnswer(message, picked);
    return;
  }

  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick mr-q" aria-hidden="true">i</span><h2 id="fb-h">Este correo era real</h2></div>
    <p>El correo de <b>${esc(message.from)}</b> no es phishing. Esto es lo que conviene saber sobre lo que marcaste:</p>
    <ul class="fb-list">${picked.map((key) => `<li class="fb-item info"><span class="fb-ic" aria-hidden="true"></span><div><b>${MR_REASONS.find(([value]) => value === key)[1]}</b><div>${mrAnswer(key, message)}</div></div></li>`).join('')}</ul>
    <div class="mr-fix"><b>¿Crees que te equivocaste? Así lo corriges:</b>
      <ol><li>Toca <b>Spam</b> en el menú de la izquierda.</li><li>En la fila de este correo, toca <b>Not spam</b> (o ábrelo y toca <b>Not spam</b>).</li><li>El correo volverá a tu bandeja de entrada.</li></ol></div>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="mr-spam">${ic('spam')}Ir a la carpeta Spam</button><button class="m-link" type="button" data-act="mr-close">Cerrar</button></div>
  </div>`;

  const box = $m('m-fb').querySelector('.m-fb');
  box.scrollTop = 0;
  /** @type {HTMLElement} */ (box.querySelector('.m-big')).focus({ preventScroll: true });
}
