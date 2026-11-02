import { esc } from '../../shared/dom.js';
import { INVOICE } from '../data/attachments.js';
import { issueLabel } from './issues.js';
import { DATE_RE, fold, writingChecks } from './writing-checks.js';

// Word families, so “Facturas”, “Facturación”, “Ausentarme” or “Solicito” count too.
const DAY_OFF_SUBJECT_RE = /\b(dias?|days?|libres?|permisos?|descanso|ausen\w*|falt\w*|solicit\w*|ped\w*|pido|peticion\w*|request\w*|vacacion\w*|vacation\w*|licencia\w*|leave|off|pto|cita\w*|medic\w*|appointment\w*)\b/;
const INVOICE_SUBJECT_RE = /(\b(factur\w*|fact|invoic\w*|bill\w*|recib\w*|receipt\w*|cobro\w*|pago\w*|payment\w*)|1045)/;

/** True when the subject says what the email is about, for the given practice. */
export function subjectIsClear(subject, mode) {
  const text = fold(subject);
  if (mode === 'boss') return DAY_OFF_SUBJECT_RE.test(text) || DATE_RE.test(text);
  if (mode === 'client') return INVOICE_SUBJECT_RE.test(text);
  return true;
}

function attCheck(attachments, mode) {
  const list = attachments || [];
  if (mode !== 'client') {
    return list.length
      ? [{ ok: true, t: 'Archivos adjuntos', d: `Adjuntaste: ${list.map(esc).join(', ')}.` }]
      : [];
  }

  if (!list.length) {
    return [{ ok: false, id: 'NO_ATTACHMENT', t: issueLabel('NO_ATTACHMENT'), d: `Tu correo no lleva la factura. Toca <b>Attach</b> (el clip) y elige <b>${INVOICE}</b>.` }];
  }

  const right = list.includes(INVOICE);
  const extra = list.filter((name) => name !== INVOICE);
  if (!right) {
    const other = extra.find((name) => /^Factura_/i.test(name));
    return [{
      ok: false,
      id: 'WRONG_ATTACHMENT', t: issueLabel('WRONG_ATTACHMENT'),
      d: other
        ? `Adjuntaste <b>${esc(other)}</b>, que es la factura de <b>otro cliente</b>. Enviarla sería un error serio, porque tiene datos privados de otra persona. Quítala con la ✕ y adjunta <b>${INVOICE}</b>.`
        : `Adjuntaste <b>${list.map(esc).join(', ')}</b>, pero eso no es la factura. Quítalo con la ✕ y adjunta <b>${INVOICE}</b>.`,
    }];
  }

  if (extra.length) {
    return [{
      ok: false,
      id: 'EXTRA_ATTACHMENTS', t: issueLabel('EXTRA_ATTACHMENTS'),
      d: `Adjuntaste la factura correcta, pero también <b>${extra.map(esc).join(', ')}</b>. Envía solo lo que el cliente necesita: quita los demás archivos con la ✕.`,
    }];
  }

  return [{ ok: true, t: 'Archivo adjunto', d: `Adjuntaste la factura correcta: <b>${INVOICE}</b>.` }];
}

export function analyze(message, kind, own, mode) {
  const items = [];
  const subject = message.subject === '(no subject)' ? '' : message.subject;
  const quoted = esc(subject);

  items.push({ ok: true, t: 'Destinatario', d: `Enviaste el correo a ${esc(message.to)}.` });

  if (!subject) {
    items.push({ ok: false, id: 'NO_SUBJECT', t: issueLabel('NO_SUBJECT'), d: 'Enviaste el correo sin asunto. Recuerda: el asunto es el título del mensaje y ayuda a que lo abran y lo encuentren después.' });
  } else if (subject.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length >= 4 && subject === subject.toUpperCase()) {
    items.push({ ok: false, id: 'SUBJECT_ALL_CAPS', t: issueLabel('SUBJECT_ALL_CAPS'), d: `“${quoted}” está todo en mayúsculas. En un correo parece que estás gritando. Mejor usa mayúsculas solo al principio.` });
  } else if (subject.length > 60) {
    items.push({ ok: false, id: 'SUBJECT_TOO_LONG', t: issueLabel('SUBJECT_TOO_LONG'), d: 'Tu asunto es largo. Procura que sea breve: unas pocas palabras bastan.' });
  } else if (!subjectIsClear(subject, mode)) {
    // A tip, not a blocker: the learner can finish the step and still sees how to improve.
    items.push({
      ok: true,
      tip: true,
      id: 'SUBJECT_UNCLEAR', t: issueLabel('SUBJECT_UNCLEAR'),
      d: mode === 'boss'
        ? `“${quoted}” podría ser más claro. Para tu jefa, un buen asunto dice qué pides, por ejemplo: “Solicitud de día libre – viernes 24”.`
        : `“${quoted}” podría ser más claro. Para un cliente, un buen asunto menciona la factura, por ejemplo: “Factura n.º 1045”.`,
    });
  } else {
    items.push({ ok: true, t: 'Asunto', d: `Escribiste un asunto: “${quoted}”. Así la otra persona sabe de qué trata antes de abrirlo.` });
  }

  items.push(...attCheck(message.atts, mode));

  if (kind === 'forward') {
    items.push({ ok: true, t: 'Mensaje reenviado', d: 'Reenviaste el mensaje original. Puedes agregar una nota arriba para explicar por qué lo envías.' });
    return { items, req: null };
  }

  if (!own) {
    items.push({ ok: false, id: 'EMPTY_BODY', t: issueLabel('EMPTY_BODY'), d: 'Enviaste el correo sin texto. Un mensaje corto explica qué necesitas o qué quieres decir.' });
    return { items, req: null };
  }

  const writing = writingChecks(own, mode);
  return { items: items.concat(writing.items), req: writing.req };
}

export const listEs = (items) => (
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
);
