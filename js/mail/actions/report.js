import { learner, learnerName } from '../../learner/state.js';
import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { mail } from '../state.js';

const REPORT_CSS = `.rp-who{margin:0 0 .4em;font-size:1.05em}
body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f2430;background:#fff;max-width:48em;margin:0 auto;padding:1.5em 1.2em;line-height:1.45}
h1{font-size:1.6em;margin:0 0 .2em}.rp-date{color:#6b7280;margin:0 0 1em}.fb-sum{margin:.3em 0}
.rp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.6em;margin:.5em 0 .9em}.rp-stat{background:#f3f6fb;border-radius:.7em;padding:.55em .6em;text-align:center;font-size:.92em}.rp-stat b{display:block;font-size:1.6em}
.rp-focus{background:#ffedd5;border:3px solid #ea580c;border-radius:.9em;padding:.8em 1em .6em;color:#7c2d12;margin:.2em 0 1em}.rp-focus h3{margin:0 0 .2em;color:#9a3412}.rp-focus ol{margin:.3em 0 .2em;padding-left:1.4em}.rp-focus li{margin:.55em 0}.rp-focus li p{margin:.15em 0}
.rp-count{display:inline-block;background:#fff;border:2px solid #ea580c;border-radius:1em;padding:0 .55em;font-size:.82em;font-weight:700;margin-left:.3em}.rp-prio{display:inline-block;background:#c2410c;color:#fff;border-radius:1em;padding:0 .55em;font-size:.78em;font-weight:700;margin-left:.3em}.rp-where{font-size:.88em;opacity:.85}
.rp-step{border:1px solid #d6dae1;border-radius:.8em;padding:.7em .9em;margin:.6em 0;break-inside:avoid}.rp-head{display:flex;align-items:center;gap:.5em;flex-wrap:wrap}.rp-head h3{margin:0;font-size:1.05em;flex:1 1 12em}
.rp-num{width:1.8em;height:1.8em;border-radius:50%;background:#1f6fe0;color:#fff;display:grid;place-items:center;font-weight:700}.rp-chip{font-size:.82em;border-radius:1em;padding:.15em .65em;background:#eef0f4;font-weight:600}.rp-chip.ok{background:#e4f6ea;color:#14532d}.rp-chip.star{background:#fff1c2;color:#7a4a00}
.rp-step h4{margin:.55em 0 .1em;font-size:.92em;color:#6b7280}.rp-list{margin:.15em 0 .3em;padding-left:1.2em}.rp-detail{margin:.35em 0 .1em}.rp-good{color:#1a8a3f;margin:.3em 0 0}.rp-fixed{color:#1a8a3f;font-weight:600;font-size:.88em}.rp-keep{color:#b45309;font-weight:600;font-size:.88em}.m-muted{color:#6b7280}
@media print{body{padding:0}.rp-focus,.rp-stat,.rp-chip,.rp-num,.rp-prio{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

const STEP_NAMES = ['', 'Leer correos nuevos', 'Borrar correos que no necesitas', 'Reportar un correo falso', 'Responder a Sofía', 'Pedir un día libre a tu jefa', 'Enviar una factura a un cliente', 'Cerrar tu sesión'];

const ISSUE_CAT = {
  'Falta el saludo': 'greet',
  'Saludo muy informal': 'greet',
  'Falta la despedida': 'bye',
  'Despedida muy informal': 'bye',
  'Falta el asunto': 'subject',
  'Asunto en mayúsculas': 'subject',
  'Asunto muy largo': 'subject',
  'Asunto poco claro': 'subject',
  'Mensaje vacío': 'body',
  'Oración demasiado larga': 'runon',
  'Faltan espacios entre palabras': 'spaces',
  'Falta tu respuesta a su pregunta': 'answer',
  'Falta tu petición': 'request',
  'Falta el día': 'request',
  'Pídelo con cortesía': 'request',
  'Agrega el motivo': 'request',
  'Falta el archivo adjunto': 'attach',
  'Archivo equivocado': 'attach',
  'Archivos de más': 'attach',
  'Avisa que va un adjunto': 'attach',
  'Falta mencionar la factura': 'attach',
  'Falta el número de factura': 'attach',
  'Borraste el correo de Sofía, que necesitabas después': 'inbox',
  'Borraste el correo falso en lugar de reportarlo como spam': 'phish',
  'Reportaste como spam un correo real': 'phish',
};

const CATS = {
  greet: ['Saludar al principio', 'Empieza siempre con un saludo en la primera línea: “Hola Sofía,” con amigos y familia, “Estimada Laura:” en el trabajo.'],
  bye: ['Despedirte al final', 'Termina con una despedida y tu nombre debajo: “Un abrazo,” con amigos, “Saludos cordiales,” o “Atentamente,” en el trabajo.'],
  subject: ['Escribir un asunto claro', 'Antes de tocar Send, revisa el cuadro “Subject”: unas pocas palabras que digan de qué trata, como “Factura n.º 1045”. Sin mayúsculas en todo.'],
  address: ['Escribir bien la dirección', 'Copia la dirección letra por letra. Revisa el @, el punto y el final (.com). Una dirección nunca lleva espacios.'],
  body: ['Escribir el mensaje', 'Antes de enviar, asegúrate de que el cuadro grande tenga tu mensaje: aunque sea corto, explica qué quieres decir.'],
  runon: ['Escribir oraciones cortas', 'Cuando termines una idea, pon un punto (.) y empieza la siguiente oración con mayúscula. Lee tu mensaje en voz alta para notarlo.'],
  spaces: ['Dejar espacios entre palabras', 'Deja un espacio entre cada palabra y después de cada coma o punto. Relee tu mensaje despacio antes de enviarlo.'],
  answer: ['Contestar lo que te preguntan', 'Lee con calma la pregunta del correo y contéstala claramente, por ejemplo: “Sí, estaré ahí el domingo.”'],
  request: ['Pedir algo con claridad y cortesía', 'Di qué pides, para qué día y por qué, con frases amables como “¿Sería posible…?” o “Quisiera pedirle…”.'],
  attach: ['Adjuntar archivos', 'Toca Attach, lee bien el nombre del archivo antes de elegirlo, revisa que solo vaya el correcto y menciona en tu mensaje que va adjunto.'],
  tools: ['Elegir el botón correcto', 'Para contestar un correo, ábrelo y toca Reply. Para escribir un correo nuevo, toca Compose.'],
  phish: ['Reconocer correos falsos', 'Desconfía de premios que no pediste, de la prisa y de quien te pide tu contraseña. Repórtalos con “Report spam”.'],
  logout: ['Cerrar tu sesión', 'Cuando termines de usar tu correo, toca “Sign out” y confirma. Cerrar el navegador o la pestaña no siempre cierra tu sesión, sobre todo en un aparato compartido.'],
  inbox: ['Organizar tu bandeja con cuidado', 'Antes de borrar un correo, mira quién lo envía y si todavía lo necesitas.'],
};

const reportDate = () => new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

function reportFile() {
  const body = $m('m-fb').querySelector('.rp-body').innerHTML;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Informe de práctica de correo${learnerName() ? ` – ${esc(learnerName())}` : ''}</title><style>${REPORT_CSS}</style></head><body><h1>Informe de práctica de correo</h1>${body}</body></html>`;
}

function reportStatus(message) {
  const status = $m('rp-status');
  if (status) status.textContent = message;
}

export async function downloadReport() {
  const slug = learnerName()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const name = `Informe_practica_${slug || 'correo'}.html`;
  const html = reportFile();

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
      reportStatus(`Listo: tu informe se descargó como “${name}”. Puedes adjuntarlo en un correo, como practicaste en el paso 6.`);
    } catch (error) {
      if (error && error.code === 'declined') reportStatus('Descarga cancelada. Toca “Descargar mi informe” si quieres intentarlo otra vez.');
      else if (error && error.code === 'rate_limited') reportStatus('Espera un momento y vuelve a tocar “Descargar mi informe”.');
      else reportStatus('No se pudo descargar aquí. Toca “Copiar informe” y pégalo en un correo.');
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
    reportStatus(`Listo: tu informe se descargó como “${name}”.`);
  } catch (_) {
    reportStatus('No se pudo descargar aquí. Toca “Copiar informe” y pégalo en un correo.');
  }
}

export async function copyReport() {
  const body = /** @type {HTMLElement} */ ($m('m-fb').querySelector('.rp-body'));
  const text = `Informe de práctica de correo\n\n${body.innerText.replace(/\n{3,}/g, '\n\n')}`;
  let copied = false;

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
    ? 'Informe copiado. Abre un correo nuevo, toca el cuadro del mensaje y pégalo.'
    : 'No se pudo copiar automáticamente. Selecciona el texto del informe y cópialo.');
}

export function showReport() {
  const mission = mail.mission;
  const log = mission.log;
  const categories = {};
  const where = {};

  const add = (category, count, step) => {
    if (!category) return;
    categories[category] = (categories[category] || 0) + count;
    (where[category] = where[category] || new Set()).add(step);
  };

  for (let step = 1; step <= 6; step++) {
    for (const [text, count] of Object.entries(log[step].issues)) add(ISSUE_CAT[text], count, step);
    for (const help of Object.values(log[step].helps)) add(help.cat, help.n, step);
  }

  const focus = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const triesOf = (step) => Math.max(1, log[step].tries);
  const cleanOf = (step) => (
    (step < 3 || triesOf(step) === 1)
    && !Object.keys(log[step].issues).length
    && !Object.values(log[step].helps).some((help) => help.cat)
  );
  const totalTries = [3, 4, 5, 6, 7].reduce((total, step) => total + triesOf(step), 0);
  const clean = [1, 2, 3, 4, 5, 6, 7].filter(cleanOf).length;
  const helpsN = [1, 2, 3, 4, 5, 6, 7].reduce(
    (total, step) => total + Object.values(log[step].helps).filter((help) => help.cat).reduce((sum, help) => sum + help.n, 0),
    0,
  );
  const veces = (count) => (count === 1 ? '1 vez' : `${count} veces`);

  const detail = (step) => step === 1
    ? `Abriste ${mission.read.size} correos nuevos.`
    : step === 2
      ? `Borraste ${mission.deleted.size} correos.`
      : step === 3
        ? (log[3].early ? 'Lo reportaste como spam incluso antes de llegar a este paso. ¡Muy bien!' : 'Encontraste el correo falso y lo reportaste como spam.')
        : step === 7
          ? `Cerraste tu sesión con “Sign out” y confirmaste${triesOf(step) > 1 ? ` (tocaste “Sign out” ${triesOf(step)} veces)` : ''}.`
          : `Lo enviaste ${triesOf(step) === 1 ? 'una vez y quedó completo' : `${triesOf(step)} veces hasta completarlo`}.`;

  const stepHTML = (step) => {
    const entry = log[step];
    const issues = Object.entries(entry.issues);
    const helps = Object.entries(entry.helps);
    const tries = triesOf(step);
    const last = entry.last || [];

    return `<section class="rp-step"><div class="rp-head"><span class="rp-num" aria-hidden="true">${step}</span><h3>${STEP_NAMES[step]}</h3><span class="rp-chip ok">✓ Completado</span>${step >= 3 ? `<span class="rp-chip">${tries} ${tries === 1 ? 'intento' : 'intentos'}</span>` : ''}${cleanOf(step) ? '<span class="rp-chip star">★ A la primera</span>' : ''}</div>
      <p class="rp-detail">${detail(step)}</p>
      ${issues.length ? `<h4>Puntos que tuviste que revisar</h4><ul class="rp-list">${issues.map(([text, count]) => `<li>${esc(text)}${count > 1 ? ` (${veces(count)})` : ''}${step >= 4 ? (last.includes(text) ? ' · <span class="rp-keep">Sigue practicando</span>' : ' · <span class="rp-fixed">✓ Lo corregiste</span>') : ''}</li>`).join('')}</ul>` : '<p class="rp-good">No tuviste nada que corregir.</p>'}
      ${helps.length ? `<h4>Ayudas y redirecciones</h4><ul class="rp-list">${helps.map(([text, help]) => `<li>${esc(text)}${help.n > 1 ? ` (${veces(help.n)})` : ''}</li>`).join('')}</ul>` : ''}
    </section>`;
  };

  const focusHTML = focus.length
    ? `<p>Esto es lo que más se repitió en tu práctica. Empieza por los primeros puntos.</p><ol>${focus.map(([key, count], index) => `<li><b>${CATS[key][0]}</b><span class="rp-count">${veces(count)}</span>${index < 3 ? '<span class="rp-prio">Practica primero</span>' : ''}<p>${CATS[key][1]}</p><p class="rp-where">Pasó en: ${[...where[key]].sort().map((step) => `Paso ${step}`).join(', ')}</p></li>`).join('')}</ol>`
    : '<p><b>¡Felicidades!</b> Hiciste todo sin errores ni ayudas. Repite la práctica cuando quieras para ganar rapidez y confianza.</p>';

  $m('m-fb').innerHTML = `<div class="m-fb m-report" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="fb-top"><span class="fb-tick" aria-hidden="true">${ic('starred')}</span><h2 id="fb-h">Tu informe de práctica</h2></div>
    <div class="rp-body">
    <p class="rp-who"><b>Nombre:</b> ${esc(learnerName() || 'Sin nombre')} · <b>Fecha:</b> ${reportDate()}</p>
    <p class="fb-sum">${learner.first ? `¡Felicidades, ${esc(learner.first)}! ` : ''}Completaste las 7 prácticas de correo. Aquí ves cuántos intentos hiciste, qué revisaste en cada una y en qué te conviene practicar más.</p>
    <div class="rp-stats"><div class="rp-stat"><b>7 de 7</b>prácticas completadas</div><div class="rp-stat"><b>${clean} de 7</b>a la primera</div><div class="rp-stat"><b>${helpsN}</b>${helpsN === 1 ? 'aviso o ayuda' : 'avisos o ayudas'}</div></div>
    <section class="rp-focus"><h3>🎯 En qué enfocarte</h3>${focusHTML}</section>
    <h3 style="margin:.4em 0 0">Tus prácticas, paso a paso</h3>
    <p class="m-muted" style="margin:.1em 0 0">Intentos en total (pasos 3 a 7): ${totalTries}</p>
    ${[1, 2, 3, 4, 5, 6, 7].map(stepHTML).join('')}
    </div>
    <div class="fb-actions"><button class="m-big primary" type="button" data-act="report-download">${ic('inbox')}Descargar mi informe</button><button class="m-big" type="button" data-act="report-copy">Copiar informe</button><button class="m-big" type="button" data-act="mission-restart">Empezar de nuevo</button><button class="m-link" type="button" data-act="fb-close">Cerrar</button></div>
    <p class="rp-status" id="rp-status" role="status"></p>
  </div>`;
  $m('m-fb').hidden = false;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-fb')).scrollTop = 0;
  /** @type {HTMLElement} */ ($m('m-fb').querySelector('.m-big')).focus({ preventScroll: true });
}
