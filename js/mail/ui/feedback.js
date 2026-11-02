import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { CONTACTS } from '../contacts.js';
import { INVOICE } from '../data/attachments.js';
import { analyze, listText } from '../domain/analysis.js';
import { finishReplay, updateLog, withHelp, withIssue, withStep, withTry } from '../domain/mission-state.js';
import { L } from '../../shared/i18n.js';
import { fold } from '../domain/writing-checks.js';
import { mail, sofiaMsg } from '../state.js';
import { drawMain } from './render.js';
import { STEP } from '../mission-steps.js';

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
    : mission.step === STEP.REPLY_SOFIA && toSofia ? STEP.REPLY_SOFIA
      : mission.step === STEP.ASK_DAY_OFF && (toBoss || nearBoss) ? STEP.ASK_DAY_OFF
        : mission.step === STEP.SEND_INVOICE && (toClient || nearClient) ? STEP.SEND_INVOICE
          : 0;

  const ALL_GREEN = () => L(
    'Para completar la práctica, todos los puntos deben estar en verde. Revisa los consejos marcados con “!” y toca <b>Intentarlo nuevamente</b>: tu correo se abrirá otra vez para que lo corrijas.',
    'To complete the practice, every point must be green. Check the tips marked with “!” and tap <b>Try again</b>: your email will open again so you can fix it.',
  );

  const retryFor = (who, missing) => (
    kind !== 'new'
      ? L(`Para esta práctica, escribe un correo nuevo ${who}. Toca <b>Intentarlo nuevamente</b>.`, `For this practice, write a new email ${who}. Tap <b>Try again</b>.`)
      : !own
        ? L(`Tu correo no tenía texto. Toca <b>Intentarlo nuevamente</b> y escríbele ${who}.`, `Your email had no text. Tap <b>Try again</b> and write ${who}.`)
        : missing.length
          ? L(`Tu correo llegó, pero le falta ${listText(missing)}. Toca <b>Intentarlo nuevamente</b>: tu correo se abrirá otra vez para que lo corrijas.`, `Your email arrived, but it is missing ${listText(missing)}. Tap <b>Try again</b>: your email will open again so you can fix it.`)
          : ALL_GREEN()
  );

  if (mission.step === STEP.REPLY_SOFIA && !mission.done && toSofia) {
    const missing = req
      ? [
        !req.greet && L('un saludo al principio', 'a greeting at the start'),
        !req.answer && L('tu respuesta a su pregunta (¿irás a cenar el domingo?)', 'your answer to her question (will you come for dinner on Sunday?)'),
        !req.bye && L('una despedida al final', 'a closing at the end'),
      ].filter(Boolean)
      : [];

    if (sofiaReply && own && allOk) {
      mission = withStep(mission, STEP.ASK_DAY_OFF);
      mail.mission = mission;
      next = STEP.ASK_DAY_OFF;
      done = L('<b>¡Paso 4 completado!</b> Tu respuesta a Sofía está completa y correcta. Toca “Continuar al paso 5” para seguir.', '<b>Step 4 complete!</b> Your reply to Sofía is complete and correct. Tap “Continue to step 5” to go on.');
    } else {
      again = 'sofia';
      retry = kind !== 'reply'
        ? L('Este fue un correo nuevo. Para esta práctica hay que responder al correo de Sofía. Toca <b>Intentarlo nuevamente</b> y se abrirá tu respuesta.', 'This was a new email. For this practice you need to reply to Sofía’s email. Tap <b>Try again</b> and your reply will open.')
        : !own
          ? L('Tu respuesta no tenía texto. Toca <b>Intentarlo nuevamente</b> y dile a Sofía si irás a cenar el domingo.', 'Your reply had no text. Tap <b>Try again</b> and tell Sofía whether you will come for dinner on Sunday.')
          : missing.length
            ? L(`Tu respuesta llegó, pero le falta ${listText(missing)}. Toca <b>Intentarlo nuevamente</b>: tu respuesta se abrirá otra vez para que la corrijas.`, `Your reply arrived, but it is missing ${listText(missing)}. Tap <b>Try again</b>: your reply will open again so you can fix it.`)
            : L('Para completar la práctica, todos los puntos deben estar en verde. Revisa los consejos marcados con “!” y toca <b>Intentarlo nuevamente</b>: tu respuesta se abrirá otra vez para que la corrijas.', 'To complete the practice, every point must be green. Check the tips marked with “!” and tap <b>Try again</b>: your reply will open again so you can fix it.');
    }
  } else if (mission.step === STEP.ASK_DAY_OFF && !mission.done && toBoss) {
    const missing = req
      ? [
        !hasSubject && L('un asunto', 'a subject'),
        !req.greet && L('un saludo al principio', 'a greeting at the start'),
        !req.request && L('tu petición de un día libre', 'your request for a day off'),
        !req.date && L('qué día necesitas libre', 'which day you need off'),
        !req.bye && L('una despedida al final', 'a closing at the end'),
      ].filter(Boolean)
      : [];

    if (kind === 'new' && own && allOk) {
      mission = withStep(mission, STEP.SEND_INVOICE);
      mail.mission = mission;
      next = STEP.SEND_INVOICE;
      done = L('<b>¡Paso 5 completado!</b> Le pediste un día libre a tu jefa con un correo claro, completo y profesional. Toca “Continuar al paso 6” para la última práctica.', '<b>Step 5 complete!</b> You asked your manager for a day off with a clear, complete and professional email. Tap “Continue to step 6” for the next practice.');
    } else {
      again = 'boss';
      retry = retryFor(L('a tu jefa', 'to your manager'), missing);
    }
  } else if (mission.step === STEP.ASK_DAY_OFF && !mission.done && /laura|martinez/.test(fold(message.to))) {
    again = 'boss';
    retry = L(`La dirección no es exactamente la de tu jefa. Escribiste “${esc(message.to)}”, pero debe ser “${CONTACTS.boss.email}”. Toca <b>Intentarlo nuevamente</b> y compárala letra por letra.`, `The address is not exactly your manager’s. You typed “${esc(message.to)}”, but it should be “${CONTACTS.boss.email}”. Tap <b>Try again</b> and compare it letter by letter.`);
  } else if (mission.step === STEP.SEND_INVOICE && !mission.done && toClient) {
    const missing = [
      !hasSubject && L('un asunto', 'a subject'),
      !attachments.length && L('la factura adjunta', 'the attached invoice'),
      (attachments.length && !rightFile) && L('la factura correcta (n.º 1045)', 'the right invoice (#1045)'),
      req && !req.greet && L('un saludo al principio', 'a greeting at the start'),
      req && !req.bye && L('una despedida al final', 'a closing at the end'),
    ].filter(Boolean);

    if (kind === 'new' && own && allOk) {
      mission = withStep(mission, STEP.SIGN_OUT);
      mail.mission = mission;
      next = STEP.SIGN_OUT;
      done = L('<b>¡Paso 6 completado!</b> Le enviaste a tu cliente la factura correcta con un mensaje profesional. Toca “Continuar al paso 7” para la última práctica.', '<b>Step 6 complete!</b> You sent your client the right invoice with a professional message. Tap “Continue to step 7” for the last practice.');
    } else {
      again = 'client';
      retry = retryFor(L('a tu cliente', 'to your client'), missing);
    }
  } else if (mission.step === STEP.SEND_INVOICE && !mission.done && /carlos|rivera/.test(fold(message.to))) {
    again = 'client';
    retry = L(`La dirección no es exactamente la de tu cliente. Escribiste “${esc(message.to)}”, pero debe ser “${CONTACTS.client.email}”. Toca <b>Intentarlo nuevamente</b> y compárala letra por letra.`, `The address is not exactly your client’s. You typed “${esc(message.to)}”, but it should be “${CONTACTS.client.email}”. Tap <b>Try again</b> and compare it letter by letter.`);
  }

  // Extra practice of a finished step: go back to where the learner was instead of advancing.
  if (next && mission.replay) {
    const { wasDone } = mission.replay;
    mission = finishReplay(mission);
    mail.mission = mission;
    next = wasDone ? 0 : mission.step;
    done = L(
      '<b>¡Muy bien!</b> Completaste otra vez este paso. Tu informe ya incluye esta práctica.',
      '<b>Well done!</b> You completed this step again. Your report now includes this practice.',
    );
  }

  if (context) {
    // Tips are logged so the report can mention them, but they never block the step.
    const warnings = items.filter((item) => !item.ok || item.tip).map((item) => item.id || item.t);
    mission = withTry(mission, context);
    warnings.forEach((warning) => {
      mission = withIssue(mission, context, warning);
    });
    mission = updateLog(mission, context, { last: warnings });
    if (kind !== (context === STEP.REPLY_SOFIA ? 'reply' : 'new')) {
      mission = withHelp(mission, context, context === STEP.REPLY_SOFIA
        ? { es: 'Escribiste un correo nuevo en vez de usar “Reply”', en: 'You wrote a new email instead of using “Reply”' }
        : { es: 'Usaste “Reply” o “Forward” en vez de “Compose”', en: 'You used “Reply” or “Forward” instead of “Compose”' }, 'tools');
    }
    if (!recipients.includes(context === STEP.REPLY_SOFIA ? CONTACTS.sofia.email : context === STEP.ASK_DAY_OFF ? CONTACTS.boss.email : CONTACTS.client.email)) {
      mission = withHelp(mission, context, { es: `La dirección tenía un error: “${message.to}”`, en: `The address had a mistake: “${message.to}”` }, 'address');
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
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('sent')}</span><h2 id="fb-h">${L('¡Correo enviado!', 'Email sent!')}</h2></div>
    <p class="fb-sum">${allOk ? (mode === 'boss' || mode === 'client' ? L('¡Excelente! Tu correo es claro, completo y profesional.', 'Excellent! Your email is clear, complete and professional.') : L('¡Excelente! Tu correo está completo y es amable.', 'Excellent! Your email is complete and friendly.')) : L('Tu correo salió bien. Estos consejos te ayudarán a escribir mejores correos.', 'Your email was sent. These tips will help you write better emails.')}</p>
    ${done ? `<p class="fb-mission">${done}</p>` : ''}
    ${retry ? `<p class="fb-retry"><b>${L('Casi:', 'Almost:')}</b> ${retry}</p>` : ''}
    <ul class="fb-list">${items.map((item) => `<li class="fb-item ${item.tip ? 'info' : item.ok ? 'ok' : 'warn'}"><span class="fb-ic" aria-hidden="true"></span><div><b>${item.t}</b><div>${item.d}</div></div></li>`).join('')}</ul>
    <div class="fb-actions">${again ? `<button class="m-big primary" type="button" data-act="fb-retry">${L('Intentarlo nuevamente', 'Try again')}</button>`
      : mission.done && done ? `<button class="m-big primary" type="button" data-act="report">${L('Ver mi informe', 'See my report')}</button>`
        : next ? `<button class="m-big primary" type="button" data-act="fb-next">${L(`Continuar al paso ${next}`, `Continue to step ${next}`)} →</button>`
          : `<button class="m-big primary" type="button" data-act="fb-sent">${L('Ver en Enviados', 'See it in Sent')}</button><button class="m-big" type="button" data-act="fb-new">${L('Escribir otro correo', 'Write another email')}</button><button class="m-link" type="button" data-act="fb-close">${L('Cerrar', 'Close')}</button>`}</div>
  </div>`;
  $m('m-fb').hidden = false;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-big')).focus();
}
