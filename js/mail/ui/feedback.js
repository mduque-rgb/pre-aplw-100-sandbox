import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { CONTACTS } from '../contacts.js';
import { INVOICE } from '../data/attachments.js';
import { analyze, listEs } from '../domain/analysis.js';
import { updateLog, withHelp, withIssue, withStep, withTry } from '../domain/mission-state.js';
import { fold } from '../domain/writing-checks.js';
import { mail, sofiaMsg } from '../state.js';
import { drawMain } from './render.js';

export function showFeedback(message, kind, own) {
  let mission = mail.mission;
  const recipients = message.to.toLowerCase().split(/[,;]/).map((entry) => entry.trim());
  const toSofia = recipients.includes(CONTACTS.sofia.email);
  const toBoss = recipients.includes(CONTACTS.boss.email);
  const toClient = recipients.includes(CONTACTS.client.email);
  const sofiaReply = kind === 'reply' && toSofia;
  const nearBoss = !toBoss && /laura|martinez/.test(fold(message.to));
  const nearClient = !toClient && /carlos|rivera/.test(fold(message.to));
  const mode = sofiaReply ? 'sofia' : (toBoss || nearBoss) ? 'boss' : (toClient || nearClient) ? 'client' : '';

  const { items, req } = analyze(message, kind, own, mode);
  const allOk = items.every((item) => item.ok);
  const hasSubject = message.subject !== '(no subject)';
  const attachments = message.atts || [];
  const rightFile = attachments.includes(INVOICE);

  let done = '';
  let retry = '';
  let next = 0;
  /** @type {import('../types.js').MissionContext} */
  let again = '';
  const context = mission.done ? 0
    : mission.step === 4 && toSofia ? 4
      : mission.step === 5 && (toBoss || nearBoss) ? 5
        : mission.step === 6 && (toClient || nearClient) ? 6
          : 0;

  const retryFor = (who, missing) => (
    kind !== 'new'
      ? `Para esta práctica, escribe un correo nuevo ${who}. Toca <b>Intentarlo nuevamente</b>.`
      : !own
        ? `Tu correo no tenía texto. Toca <b>Intentarlo nuevamente</b> y escríbele ${who}.`
        : missing.length
          ? `Tu correo llegó, pero le falta ${listEs(missing)}. Toca <b>Intentarlo nuevamente</b>: tu correo se abrirá otra vez para que lo corrijas.`
          : 'Para completar la práctica, todos los puntos deben estar en verde. Revisa los consejos marcados con “!” y toca <b>Intentarlo nuevamente</b>: tu correo se abrirá otra vez para que lo corrijas.'
  );

  if (mission.step === 4 && !mission.done && toSofia) {
    const missing = req
      ? [
        !req.greet && 'un saludo al principio',
        !req.answer && 'tu respuesta a su pregunta (¿irás a cenar el domingo?)',
        !req.bye && 'una despedida al final',
      ].filter(Boolean)
      : [];

    if (sofiaReply && own && allOk) {
      mission = withStep(mission, 5);
      mail.mission = mission;
      next = 5;
      done = '<b>¡Paso 4 completado!</b> Tu respuesta a Sofía está completa y correcta. Toca “Continuar al paso 5” para seguir.';
    } else {
      again = 'sofia';
      retry = kind !== 'reply'
        ? 'Este fue un correo nuevo. Para esta práctica hay que responder al correo de Sofía. Toca <b>Intentarlo nuevamente</b> y se abrirá tu respuesta.'
        : !own
          ? 'Tu respuesta no tenía texto. Toca <b>Intentarlo nuevamente</b> y dile a Sofía si irás a cenar el domingo.'
          : missing.length
            ? `Tu respuesta llegó, pero le falta ${listEs(missing)}. Toca <b>Intentarlo nuevamente</b>: tu respuesta se abrirá otra vez para que la corrijas.`
            : 'Para completar la práctica, todos los puntos deben estar en verde. Revisa los consejos marcados con “!” y toca <b>Intentarlo nuevamente</b>: tu respuesta se abrirá otra vez para que la corrijas.';
    }
  } else if (mission.step === 5 && !mission.done && toBoss) {
    const missing = req
      ? [
        !hasSubject && 'un asunto',
        !req.greet && 'un saludo al principio',
        !req.request && 'tu petición de un día libre',
        !req.date && 'qué día necesitas libre',
        !req.bye && 'una despedida al final',
      ].filter(Boolean)
      : [];

    if (kind === 'new' && own && allOk) {
      mission = withStep(mission, 6);
      mail.mission = mission;
      next = 6;
      done = '<b>¡Paso 5 completado!</b> Le pediste un día libre a tu jefa con un correo claro, completo y profesional. Toca “Continuar al paso 6” para la última práctica.';
    } else {
      again = 'boss';
      retry = retryFor('a tu jefa', missing);
    }
  } else if (mission.step === 5 && !mission.done && /laura|martinez/.test(fold(message.to))) {
    again = 'boss';
    retry = `La dirección no es exactamente la de tu jefa. Escribiste “${esc(message.to)}”, pero debe ser “${CONTACTS.boss.email}”. Toca <b>Intentarlo nuevamente</b> y compárala letra por letra.`;
  } else if (mission.step === 6 && !mission.done && toClient) {
    const missing = [
      !hasSubject && 'un asunto',
      !attachments.length && 'la factura adjunta',
      (attachments.length && !rightFile) && 'la factura correcta (n.º 1045)',
      req && !req.greet && 'un saludo al principio',
      req && !req.bye && 'una despedida al final',
    ].filter(Boolean);

    if (kind === 'new' && own && allOk) {
      mission = withStep(mission, 7);
      mail.mission = mission;
      next = 7;
      done = '<b>¡Paso 6 completado!</b> Le enviaste a tu cliente la factura correcta con un mensaje profesional. Toca “Continuar al paso 7” para la última práctica.';
    } else {
      again = 'client';
      retry = retryFor('a tu cliente', missing);
    }
  } else if (mission.step === 6 && !mission.done && /carlos|rivera/.test(fold(message.to))) {
    again = 'client';
    retry = `La dirección no es exactamente la de tu cliente. Escribiste “${esc(message.to)}”, pero debe ser “${CONTACTS.client.email}”. Toca <b>Intentarlo nuevamente</b> y compárala letra por letra.`;
  }

  if (context) {
    const warnings = items.filter((item) => !item.ok).map((item) => item.t);
    mission = withTry(mission, context);
    warnings.forEach((warning) => {
      mission = withIssue(mission, context, warning);
    });
    mission = updateLog(mission, context, { last: warnings });
    if (kind !== (context === 4 ? 'reply' : 'new')) {
      mission = withHelp(mission, context, context === 4 ? 'Escribiste un correo nuevo en vez de usar “Reply”' : 'Usaste “Reply” o “Forward” en vez de “Compose”', 'tools');
    }
    if (!recipients.includes(context === 4 ? CONTACTS.sofia.email : context === 5 ? CONTACTS.boss.email : CONTACTS.client.email)) {
      mission = withHelp(mission, context, `La dirección tenía un error: “${message.to}”`, 'address');
    }
    mail.mission = mission;
  }

  if (again === 'sofia') {
    const sofia = sofiaMsg();
    mail.retryDraft = (kind === 'reply' && own)
      ? { title: 'Reply', to: message.to, subject: message.subject, body: message.body, kind: 'reply', focus: 'body', mission: 'sofia' }
      : {
        ...(sofia
          ? {
            title: 'Reply',
            to: sofia.addr,
            subject: /^re:/i.test(sofia.subject) ? sofia.subject : `Re: ${sofia.subject}`,
            body: `\n\nOn ${sofia.date}, ${sofia.from} wrote:\n${sofia.body.split('\n').map((line) => `> ${line}`).join('\n')}`,
            focus: 'body',
            kind: 'reply',
          }
          : { to: CONTACTS.sofia.email, kind: 'reply' }),
        mission: 'sofia',
      };
  } else if (again) {
    mail.retryDraft = {
      to: message.to,
      subject: hasSubject ? message.subject : '',
      body: kind === 'new' ? message.body : '',
      atts: [...attachments],
      mission: again,
    };
  }

  if (done) drawMain();

  $m('m-fb').innerHTML = `<div class="m-fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('sent')}</span><h2 id="fb-h">¡Correo enviado!</h2></div>
    <p class="fb-sum">${allOk ? (mode === 'boss' || mode === 'client' ? '¡Excelente! Tu correo es claro, completo y profesional.' : '¡Excelente! Tu correo está completo y es amable.') : 'Tu correo salió bien. Estos consejos te ayudarán a escribir mejores correos.'}</p>
    ${done ? `<p class="fb-mission">${done}</p>` : ''}
    ${retry ? `<p class="fb-retry"><b>Casi:</b> ${retry}</p>` : ''}
    <ul class="fb-list">${items.map((item) => `<li class="fb-item ${item.ok ? 'ok' : 'warn'}"><span class="fb-ic" aria-hidden="true"></span><div><b>${item.t}</b><div>${item.d}</div></div></li>`).join('')}</ul>
    <div class="fb-actions">${again ? '<button class="m-big primary" type="button" data-act="fb-retry">Intentarlo nuevamente</button>'
      : mission.done && done ? '<button class="m-big primary" type="button" data-act="report">Ver mi informe</button>'
        : next ? `<button class="m-big primary" type="button" data-act="fb-next">Continuar al paso ${next} →</button>`
          : '<button class="m-big primary" type="button" data-act="fb-sent">Ver en Enviados</button><button class="m-big" type="button" data-act="fb-new">Escribir otro correo</button><button class="m-link" type="button" data-act="fb-close">Cerrar</button>'}</div>
  </div>`;
  $m('m-fb').hidden = false;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-big')).focus();
}
