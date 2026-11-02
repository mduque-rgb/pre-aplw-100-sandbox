import { esc } from '../../shared/dom.js';
import { INVOICE } from '../data/attachments.js';
import { L } from '../../shared/i18n.js';
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
      ? [{ ok: true, t: L('Archivos adjuntos', 'Attachments'), d: L(`Adjuntaste: ${list.map(esc).join(', ')}.`, `You attached: ${list.map(esc).join(', ')}.`) }]
      : [];
  }

  if (!list.length) {
    return [{ ok: false, id: 'NO_ATTACHMENT', t: issueLabel('NO_ATTACHMENT'), d: L(`Tu correo no lleva la factura. Toca <b>Attach</b> (el clip) y elige <b>${INVOICE}</b>.`, `Your email does not include the invoice. Tap <b>Attach</b> (the paperclip) and choose <b>${INVOICE}</b>.`) }];
  }

  const right = list.includes(INVOICE);
  const extra = list.filter((name) => name !== INVOICE);
  if (!right) {
    const other = extra.find((name) => /^Factura_/i.test(name));
    return [{
      ok: false,
      id: 'WRONG_ATTACHMENT', t: issueLabel('WRONG_ATTACHMENT'),
      d: other
        ? L(`Adjuntaste <b>${esc(other)}</b>, que es la factura de <b>otro cliente</b>. Enviarla sería un error serio, porque tiene datos privados de otra persona. Quítala con la ✕ y adjunta <b>${INVOICE}</b>.`, `You attached <b>${esc(other)}</b>, which is <b>another client’s</b> invoice. Sending it would be a serious mistake, because it has someone else’s private data. Remove it with the ✕ and attach <b>${INVOICE}</b>.`)
        : L(`Adjuntaste <b>${list.map(esc).join(', ')}</b>, pero eso no es la factura. Quítalo con la ✕ y adjunta <b>${INVOICE}</b>.`, `You attached <b>${list.map(esc).join(', ')}</b>, but that is not the invoice. Remove it with the ✕ and attach <b>${INVOICE}</b>.`),
    }];
  }

  if (extra.length) {
    return [{
      ok: false,
      id: 'EXTRA_ATTACHMENTS', t: issueLabel('EXTRA_ATTACHMENTS'),
      d: L(`Adjuntaste la factura correcta, pero también <b>${extra.map(esc).join(', ')}</b>. Envía solo lo que el cliente necesita: quita los demás archivos con la ✕.`, `You attached the right invoice, but also <b>${extra.map(esc).join(', ')}</b>. Send only what the client needs: remove the other files with the ✕.`),
    }];
  }

  return [{ ok: true, t: L('Archivo adjunto', 'Attachment'), d: L(`Adjuntaste la factura correcta: <b>${INVOICE}</b>.`, `You attached the right invoice: <b>${INVOICE}</b>.`) }];
}

export function analyze(message, kind, own, mode) {
  const items = [];
  const subject = message.subject === '(no subject)' ? '' : message.subject;
  const quoted = esc(subject);

  items.push({ ok: true, t: L('Destinatario', 'Recipient'), d: L(`Enviaste el correo a ${esc(message.to)}.`, `You sent the email to ${esc(message.to)}.`) });

  if (!subject) {
    items.push({ ok: false, id: 'NO_SUBJECT', t: issueLabel('NO_SUBJECT'), d: L('Enviaste el correo sin asunto. Recuerda: el asunto es el título del mensaje y ayuda a que lo abran y lo encuentren después.', 'You sent the email without a subject. Remember: the subject is the title of the message and helps people open it and find it later.') });
  } else if (subject.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length >= 4 && subject === subject.toUpperCase()) {
    items.push({ ok: false, id: 'SUBJECT_ALL_CAPS', t: issueLabel('SUBJECT_ALL_CAPS'), d: L(`“${quoted}” está todo en mayúsculas. En un correo parece que estás gritando. Mejor usa mayúsculas solo al principio.`, `“${quoted}” is all in capitals. In an email it looks like shouting. Use a capital letter only at the start.`) });
  } else if (subject.length > 60) {
    items.push({ ok: false, id: 'SUBJECT_TOO_LONG', t: issueLabel('SUBJECT_TOO_LONG'), d: L('Tu asunto es largo. Procura que sea breve: unas pocas palabras bastan.', 'Your subject is long. Keep it short: a few words are enough.') });
  } else if (!subjectIsClear(subject, mode)) {
    // A tip, not a blocker: the learner can finish the step and still sees how to improve.
    items.push({
      ok: true,
      tip: true,
      id: 'SUBJECT_UNCLEAR', t: issueLabel('SUBJECT_UNCLEAR'),
      d: mode === 'boss'
        ? L(`“${quoted}” podría ser más claro. Para tu jefa, un buen asunto dice qué pides, por ejemplo: “Solicitud de día libre – viernes 24”.`, `“${quoted}” could be clearer. For your manager, a good subject says what you are asking for, for example: “Day off request – Friday 24”.`)
        : L(`“${quoted}” podría ser más claro. Para un cliente, un buen asunto menciona la factura, por ejemplo: “Factura n.º 1045”.`, `“${quoted}” could be clearer. For a client, a good subject mentions the invoice, for example: “Invoice #1045”.`),
    });
  } else {
    items.push({ ok: true, t: L('Asunto', 'Subject'), d: L(`Escribiste un asunto: “${quoted}”. Así la otra persona sabe de qué trata antes de abrirlo.`, `You wrote a subject: “${quoted}”. Now the other person knows what it is about before opening it.`) });
  }

  items.push(...attCheck(message.atts, mode));

  if (kind === 'forward') {
    items.push({ ok: true, t: L('Mensaje reenviado', 'Forwarded message'), d: L('Reenviaste el mensaje original. Puedes agregar una nota arriba para explicar por qué lo envías.', 'You forwarded the original message. You can add a note at the top to explain why you are sending it.') });
    return { items, req: null };
  }

  if (!own) {
    items.push({ ok: false, id: 'EMPTY_BODY', t: issueLabel('EMPTY_BODY'), d: L('Enviaste el correo sin texto. Un mensaje corto explica qué necesitas o qué quieres decir.', 'You sent the email without text. A short message explains what you need or want to say.') });
    return { items, req: null };
  }

  const writing = writingChecks(own, mode);
  return { items: items.concat(writing.items), req: writing.req };
}

/** “a, b y c” / “a, b and c” in the current language. */
export const listText = (items) => (
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${L('y', 'and')} ${items[items.length - 1]}`
);
