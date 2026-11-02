import { learner, learnerName } from '../../learner/state.js';
import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { getLang, L, tx } from '../../shared/i18n.js';
import { CATEGORIES, categoryOf, issueLabel } from '../domain/issues.js';
import { canReplay } from '../domain/mission-state.js';
import { mail } from '../state.js';
import { ALL_STEPS, STEP } from '../mission-steps.js';

const REPORT_CSS = `.rp-who{margin:0 0 .4em;font-size:1.05em}
body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f2430;background:#fff;max-width:48em;margin:0 auto;padding:1.5em 1.2em;line-height:1.45}
h1{font-size:1.6em;margin:0 0 .2em}.rp-date{color:#6b7280;margin:0 0 1em}.fb-sum{margin:.3em 0}
.rp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.6em;margin:.5em 0 .9em}.rp-stat{background:#f3f6fb;border-radius:.7em;padding:.55em .6em;text-align:center;font-size:.92em}.rp-stat b{display:block;font-size:1.6em}
.rp-focus{background:#ffedd5;border:3px solid #ea580c;border-radius:.9em;padding:.8em 1em .6em;color:#7c2d12;margin:.2em 0 1em}.rp-focus h3{margin:0 0 .2em;color:#9a3412}.rp-focus ol{margin:.3em 0 .2em;padding-left:1.4em}.rp-focus li{margin:.55em 0}.rp-focus li p{margin:.15em 0}
.rp-count{display:inline-block;background:#fff;border:2px solid #ea580c;border-radius:1em;padding:0 .55em;font-size:.82em;font-weight:700;margin-left:.3em}.rp-prio{display:inline-block;background:#c2410c;color:#fff;border-radius:1em;padding:0 .55em;font-size:.78em;font-weight:700;margin-left:.3em}.rp-where{font-size:.88em;opacity:.85}
.rp-step{border:1px solid #d6dae1;border-radius:.8em;padding:.7em .9em;margin:.6em 0;break-inside:avoid}.rp-head{display:flex;align-items:center;gap:.5em;flex-wrap:wrap}.rp-head h3{margin:0;font-size:1.05em;flex:1 1 12em}
.rp-num{width:1.8em;height:1.8em;border-radius:50%;background:#1f6fe0;color:#fff;display:grid;place-items:center;font-weight:700}.rp-chip{font-size:.82em;border-radius:1em;padding:.15em .65em;background:#eef0f4;font-weight:600}.rp-chip.ok{background:#e4f6ea;color:#14532d}.rp-chip.star{background:#fff1c2;color:#7a4a00}.rp-chip.now{background:#dbe8fd;color:#0b2e6b}.rp-chip.todo{background:#f3f4f6;color:#6b7280}.rp-step.todo{opacity:.7}
.rp-step h4{margin:.55em 0 .1em;font-size:.92em;color:#6b7280}.rp-list{margin:.15em 0 .3em;padding-left:1.2em}.rp-detail{margin:.35em 0 .1em}.rp-good{color:#1a8a3f;margin:.3em 0 0}.rp-fixed{color:#1a8a3f;font-weight:600;font-size:.88em}.rp-keep{color:#b45309;font-weight:600;font-size:.88em}.m-muted{color:#6b7280}
@media print{body{padding:0}.rp-focus,.rp-stat,.rp-chip,.rp-num,.rp-prio{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

const STEP_NAMES = [
  null,
  ['Leer correos nuevos', 'Read new emails'],
  ['Borrar correos que no necesitas', 'Delete emails you no longer need'],
  ['Reportar un correo falso', 'Report a fake email'],
  ['Responder a Sofía', 'Reply to Sofía'],
  ['Pedir un día libre a tu jefa', 'Ask your manager for a day off'],
  ['Enviar una factura a un cliente', 'Send an invoice to a client'],
  ['Cerrar tu sesión', 'Sign out'],
];

const stepName = (step) => L(STEP_NAMES[step][0], STEP_NAMES[step][1]);

const reportDate = () => new Date().toLocaleDateString(getLang(), { day: 'numeric', month: 'long', year: 'numeric' });

const reportTitle = () => L('Informe de práctica de correo', 'Email practice report');

/** Report body without on-screen controls, for download and copy. */
function exportableBody() {
  const body = /** @type {HTMLElement} */ ($m('m-fb').querySelector('.rp-body').cloneNode(true));
  body.querySelectorAll('button').forEach((button) => button.remove());
  return body;
}

function reportFile() {
  const body = exportableBody().innerHTML;
  return `<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${reportTitle()}${learnerName() ? ` – ${esc(learnerName())}` : ''}</title><style>${REPORT_CSS}</style></head><body><h1>${reportTitle()}</h1>${body}</body></html>`;
}

function reportStatus(message) {
  const status = $m('rp-status');
  if (status) status.textContent = message;
}

export async function downloadReport() {
  const slug = learnerName()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const name = `${L('Informe_practica', 'Practice_report')}_${slug || L('correo', 'email')}.html`;
  const html = reportFile();
  const failed = L('No se pudo descargar aquí. Toca “Copiar informe” y pégalo en un correo.', 'The report could not be downloaded here. Tap “Copy report” and paste it into an email.');

  let downloads = null;
  try {
    const host = /** @type {any} */ (window);
    if (host.claude && host.claude.use) downloads = await host.claude.use('downloads');
  } catch (_) {
    downloads = null;
  }

  if (downloads) {
    try {
      await downloads.save({ filename: name, data: html });
      reportStatus(L(
        `Listo: tu informe se descargó como “${name}”. Puedes adjuntarlo en un correo, como practicaste en el paso 6.`,
        `Done: your report was downloaded as “${name}”. You can attach it to an email, as you practised in step 6.`,
      ));
    } catch (error) {
      const code = /** @type {{code?: string}|null} */ (error)?.code;
      if (code === 'declined') reportStatus(L('Descarga cancelada. Toca “Descargar mi informe” si quieres intentarlo otra vez.', 'Download cancelled. Tap “Download my report” to try again.'));
      else if (code === 'rate_limited') reportStatus(L('Espera un momento y vuelve a tocar “Descargar mi informe”.', 'Wait a moment and tap “Download my report” again.'));
      else reportStatus(failed);
    }
    return;
  }

  try {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    reportStatus(L(`Listo: tu informe se descargó como “${name}”.`, `Done: your report was downloaded as “${name}”.`));
  } catch (_) {
    reportStatus(failed);
  }
}

export async function copyReport() {
  // innerText needs the element in the page to keep line breaks, so measure it off-screen.
  const body = exportableBody();
  body.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(body);
  const text = `${reportTitle()}\n\n${body.innerText.replace(/\n{3,}/g, '\n\n')}`;
  body.remove();
  let copied;

  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch (_) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      textarea.remove();
    } catch (__) {
      copied = false;
    }
  }

  reportStatus(copied
    ? L('Informe copiado. Abre un correo nuevo, toca el cuadro del mensaje y pégalo.', 'Report copied. Open a new email, tap the message box and paste it.')
    : L('No se pudo copiar automáticamente. Selecciona el texto del informe y cópialo.', 'It could not be copied automatically. Select the report text and copy it.'));
}

/**
 * Shows the report. It works at any moment: finished steps, the step in
 * progress and the steps still ahead, so learners who stop early still get one.
 */
export function showReport() {
  const mission = mail.mission;
  const log = mission.log;
  const finished = mission.done;
  const total = ALL_STEPS.length;
  const isDone = (step) => finished || step < mission.step;
  const isCurrent = (step) => !finished && step === mission.step;
  const reached = ALL_STEPS.filter((step) => isDone(step) || isCurrent(step));
  const completed = ALL_STEPS.filter(isDone).length;
  const categories = {};
  const where = {};

  const add = (category, count, step) => {
    if (!category) return;
    categories[category] = (categories[category] || 0) + count;
    (where[category] = where[category] || new Set()).add(step);
  };

  for (const step of reached) {
    for (const [key, count] of Object.entries(log[step].issues)) add(categoryOf(key), count, step);
    for (const help of Object.values(log[step].helps)) add(help.cat, help.n, step);
  }

  const focus = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const triesOf = (step) => (isDone(step) ? Math.max(1, log[step].tries) : log[step].tries);
  const cleanOf = (step) => (
    isDone(step)
    && (step < STEP.REPORT_PHISH || triesOf(step) === 1)
    && !Object.keys(log[step].issues).length
    && !Object.values(log[step].helps).some((help) => help.cat)
  );
  const totalTries = reached.filter((step) => step >= STEP.REPORT_PHISH).reduce((sum, step) => sum + triesOf(step), 0);
  const clean = ALL_STEPS.filter(cleanOf).length;
  const helpsN = reached.reduce(
    (sum, step) => sum + Object.values(log[step].helps).filter((help) => help.cat).reduce((acc, help) => acc + help.n, 0),
    0,
  );
  const veces = (count) => (count === 1 ? L('1 vez', '1 time') : L(`${count} veces`, `${count} times`));
  const correos = (count, one, many) => (count === 1 ? `1 correo ${one}` : `${count} correos ${many}`);
  const emails = (count, noun) => (count === 1 ? `1 ${noun}` : `${count} ${noun}s`);
  const intentos = (count) => (count === 1 ? L('intento', 'try') : L('intentos', 'tries'));

  const doneDetail = (step) => step === STEP.READ_NEW
    ? L(`Abriste ${mission.read.size} correos nuevos.`, `You opened ${mission.read.size} new emails.`)
    : step === STEP.DELETE_OLD
      ? L(`Borraste ${mission.deleted.size} correos.`, `You deleted ${mission.deleted.size} emails.`)
      : step === STEP.REPORT_PHISH
        ? (log[STEP.REPORT_PHISH].early
          ? L('Lo reportaste como spam incluso antes de llegar a este paso. ¡Muy bien!', 'You reported it as spam even before reaching this step. Well done!')
          : L('Encontraste el correo falso y lo reportaste como spam.', 'You found the fake email and reported it as spam.'))
        : step === STEP.SIGN_OUT
          ? L(
            `Cerraste tu sesión con “Sign out” y confirmaste${triesOf(step) > 1 ? ` (tocaste “Sign out” ${triesOf(step)} veces)` : ''}.`,
            `You signed out with “Sign out” and confirmed${triesOf(step) > 1 ? ` (you tapped “Sign out” ${triesOf(step)} times)` : ''}.`,
          )
          : triesOf(step) === 1
            ? L('Lo enviaste una vez y quedó completo.', 'You sent it once and it was complete.')
            : L(`Lo enviaste ${triesOf(step)} veces hasta completarlo.`, `You sent it ${triesOf(step)} times until it was complete.`);

  const currentDetail = (step) => step === STEP.READ_NEW
    ? L(`Estás en este paso. Llevas ${correos(mission.read.size, 'nuevo leído', 'nuevos leídos')}.`, `You are on this step. You have read ${emails(mission.read.size, 'new email')} so far.`)
    : step === STEP.DELETE_OLD
      ? L(`Estás en este paso. Llevas ${correos(mission.deleted.size, 'borrado', 'borrados')}.`, `You are on this step. You have deleted ${emails(mission.deleted.size, 'email')} so far.`)
      : log[step].tries
        ? L(`Estás en este paso. Llevas ${log[step].tries} ${intentos(log[step].tries)}.`, `You are on this step. ${log[step].tries} ${intentos(log[step].tries)} so far.`)
        : L('Estás en este paso. Todavía no lo has intentado.', 'You are on this step. You have not tried it yet.');

  const issueList = (step, issues, last) => `<h4>${L('Puntos que tuviste que revisar', 'Things you had to check')}</h4><ul class="rp-list">${issues.map(([key, count]) => {
    const status = step >= STEP.REPLY_SOFIA
      ? (last.includes(key)
        ? ` · <span class="rp-keep">${L('Sigue practicando', 'Keep practising')}</span>`
        : ` · <span class="rp-fixed">${L('✓ Lo corregiste', '✓ You fixed it')}</span>`)
      : '';
    return `<li>${esc(issueLabel(key))}${count > 1 ? ` (${veces(count)})` : ''}${status}</li>`;
  }).join('')}</ul>`;

  const stepHTML = (step) => {
    const entry = log[step];
    const issues = Object.entries(entry.issues);
    const helps = Object.entries(entry.helps);
    const tries = triesOf(step);
    const last = entry.last || [];
    const pending = !isDone(step) && !isCurrent(step);

    if (pending) {
      return `<section class="rp-step todo"><div class="rp-head"><span class="rp-num" aria-hidden="true">${step}</span><h3>${stepName(step)}</h3><span class="rp-chip todo">${L('Pendiente', 'Not started')}</span></div>
      <p class="rp-detail m-muted">${L('Todavía no llegas a este paso.', 'You have not reached this step yet.')}</p>
    </section>`;
    }

    const chip = isDone(step)
      ? `<span class="rp-chip ok">${L('✓ Completado', '✓ Done')}</span>`
      : `<span class="rp-chip now">${L('En curso', 'In progress')}</span>`;
    const triesChip = step >= STEP.REPORT_PHISH && tries ? `<span class="rp-chip">${tries} ${intentos(tries)}</span>` : '';
    const replays = entry.replays ? `<span class="rp-chip">${L(`Practicado otra vez: ${veces(entry.replays)}`, `Practised again: ${veces(entry.replays)}`)}</span>` : '';
    const replayButton = canReplay(mission, step)
      ? `<button class="m-tbtn rp-replay" type="button" data-act="report-replay" data-step="${step}">${L('Practicar este paso otra vez', 'Practise this step again')}</button>`
      : '';

    return `<section class="rp-step"><div class="rp-head"><span class="rp-num" aria-hidden="true">${step}</span><h3>${stepName(step)}</h3>${chip}${triesChip}${cleanOf(step) ? `<span class="rp-chip star">${L('★ A la primera', '★ First try')}</span>` : ''}${replays}</div>
      <p class="rp-detail">${isDone(step) ? doneDetail(step) : currentDetail(step)}</p>
      ${issues.length ? issueList(step, issues, last) : isDone(step) ? `<p class="rp-good">${L('No tuviste nada que corregir.', 'You had nothing to fix.')}</p>` : ''}
      ${helps.length ? `<h4>${L('Ayudas y redirecciones', 'Help and hints')}</h4><ul class="rp-list">${helps.map(([key, help]) => `<li>${esc(tx(help.text || key))}${help.n > 1 ? ` (${veces(help.n)})` : ''}</li>`).join('')}</ul>` : ''}
      ${replayButton}
    </section>`;
  };

  const focusHTML = focus.length
    ? `<p>${L('Esto es lo que más se repitió en tu práctica. Empieza por los primeros puntos.', 'This is what came up most in your practice. Start with the first points.')}</p><ol>${focus.map(([key, count], index) => `<li><b>${tx(CATEGORIES[key].title)}</b><span class="rp-count">${veces(count)}</span>${index < 3 ? `<span class="rp-prio">${L('Practica primero', 'Practise first')}</span>` : ''}<p>${tx(CATEGORIES[key].advice)}</p><p class="rp-where">${L('Pasó en', 'Happened in')}: ${[...where[key]].sort().map((step) => `${L('Paso', 'Step')} ${step}`).join(', ')}</p></li>`).join('')}</ol>`
    : finished
      ? L('<p><b>¡Felicidades!</b> Hiciste todo sin errores ni ayudas. Repite la práctica cuando quieras para ganar rapidez y confianza.</p>', '<p><b>Congratulations!</b> You did everything without mistakes or help. Repeat the practice whenever you like to gain speed and confidence.</p>')
      : L('<p>Hasta ahora no hay nada que reforzar. ¡Sigue así!</p>', '<p>So far there is nothing to work on. Keep going!</p>');

  const name = learner.first ? esc(learner.first) : '';
  const summary = finished
    ? L(
      `${name ? `¡Felicidades, ${name}! ` : ''}Completaste las 7 prácticas de correo. Aquí ves cuántos intentos hiciste, qué revisaste en cada una y en qué te conviene practicar más.`,
      `${name ? `Congratulations, ${name}! ` : ''}You completed all 7 email practices. Here you can see how many tries you made, what you checked in each one and what to practise more.`,
    )
    : L(
      `${name ? `${name}, llegaste` : 'Llegaste'} hasta el paso ${mission.step} de ${total}. Este informe muestra lo que hiciste hasta ahora. Puedes cerrarlo y seguir practicando cuando quieras.`,
      `${name ? `${name}, you` : 'You'} reached step ${mission.step} of ${total}. This report shows what you have done so far. You can close it and keep practising whenever you like.`,
    );

  const actions = finished
    ? `<button class="m-big primary" type="button" data-act="report-download">${ic('inbox')}${L('Descargar mi informe', 'Download my report')}</button><button class="m-big" type="button" data-act="report-copy">${L('Copiar informe', 'Copy report')}</button><button class="m-big" type="button" data-act="mission-restart">${L('Empezar de nuevo', 'Start over')}</button><button class="m-link" type="button" data-act="fb-close">${L('Cerrar', 'Close')}</button>`
    : `<button class="m-big primary" type="button" data-act="fb-close">${L('Seguir practicando', 'Keep practising')}</button><button class="m-big" type="button" data-act="report-download">${ic('inbox')}${L('Descargar mi informe', 'Download my report')}</button><button class="m-big" type="button" data-act="report-copy">${L('Copiar informe', 'Copy report')}</button>`;

  $m('m-fb').innerHTML = `<div class="m-fb m-report" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('starred')}</span><h2 id="fb-h">${finished ? L('Tu informe de práctica', 'Your practice report') : L('Tu informe de avance', 'Your progress report')}</h2></div>
    <div class="rp-body">
    <p class="rp-who"><b>${L('Nombre', 'Name')}:</b> ${esc(learnerName() || L('Sin nombre', 'No name'))} · <b>${L('Fecha', 'Date')}:</b> ${reportDate()}</p>
    <p class="fb-sum">${summary}</p>
    <div class="rp-stats"><div class="rp-stat"><b>${completed} ${L('de', 'of')} ${total}</b>${L('prácticas completadas', 'practices completed')}</div><div class="rp-stat"><b>${clean} ${L('de', 'of')} ${total}</b>${L('a la primera', 'on the first try')}</div><div class="rp-stat"><b>${helpsN}</b>${helpsN === 1 ? L('aviso o ayuda', 'hint or help') : L('avisos o ayudas', 'hints or help')}</div></div>
    <section class="rp-focus"><h3>🎯 ${L('En qué enfocarte', 'What to focus on')}</h3>${focusHTML}</section>
    <h3 style="margin:.4em 0 0">${L('Tus prácticas, paso a paso', 'Your practices, step by step')}</h3>
    <p class="m-muted" style="margin:.1em 0 0">${L('Intentos en total (pasos 3 a 7)', 'Total tries (steps 3 to 7)')}: ${totalTries}</p>
    ${ALL_STEPS.map(stepHTML).join('')}
    </div>
    <div class="fb-actions">${actions}</div>
    <p class="rp-status" id="rp-status" role="status"></p>
  </div>`;
  $m('m-fb').hidden = false;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-fb')).scrollTop = 0;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-big')).focus({ preventScroll: true });
}

/** Re-renders the report if it is open, e.g. after the language changes. */
export function refreshReport() {
  if ($m('m-fb') && $m('m-fb').querySelector('.m-report')) showReport();
}
