import { esc } from '../../shared/dom.js';
import { INVOICE } from '../data/attachments.js';
import { fold, writingChecks } from './writing-checks.js';

function attCheck(attachments, mode) {
  const list = attachments || [];
  if (mode !== 'client') {
    return list.length
      ? [{ ok: true, t: 'Archivos adjuntos', d: `Adjuntaste: ${list.map(esc).join(', ')}.` }]
      : [];
  }

  if (!list.length) {
    return [{ ok: false, t: 'Falta el archivo adjunto', d: `Tu correo no lleva la factura. Toca <b>Attach</b> (el clip) y elige <b>${INVOICE}</b>.` }];
  }

  const right = list.includes(INVOICE);
  const extra = list.filter((name) => name !== INVOICE);
  if (!right) {
    const other = extra.find((name) => /^Factura_/i.test(name));
    return [{
      ok: false,
      t: 'Archivo equivocado',
      d: other
        ? `Adjuntaste <b>${esc(other)}</b>, que es la factura de <b>otro cliente</b>. Enviarla sería un error serio, porque tiene datos privados de otra persona. Quítala con la ✕ y adjunta <b>${INVOICE}</b>.`
        : `Adjuntaste <b>${list.map(esc).join(', ')}</b>, pero eso no es la factura. Quítalo con la ✕ y adjunta <b>${INVOICE}</b>.`,
    }];
  }

  if (extra.length) {
    return [{
      ok: false,
      t: 'Archivos de más',
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
    items.push({ ok: false, t: 'Falta el asunto', d: 'Enviaste el correo sin asunto. Recuerda: el asunto es el título del mensaje y ayuda a que lo abran y lo encuentren después.' });
  } else if (subject.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length >= 4 && subject === subject.toUpperCase()) {
    items.push({ ok: false, t: 'Asunto en mayúsculas', d: `“${quoted}” está todo en mayúsculas. En un correo parece que estás gritando. Mejor usa mayúsculas solo al principio.` });
  } else if (subject.length > 60) {
    items.push({ ok: false, t: 'Asunto muy largo', d: 'Tu asunto es largo. Procura que sea breve: unas pocas palabras bastan.' });
  } else if (mode === 'boss' && !/\b(dia|day|dias|days|permiso|libre|off|leave|solicitud|peticion|request|ausencia|vacaciones|vacation)\b/.test(fold(subject))) {
    items.push({ ok: false, t: 'Asunto poco claro', d: `“${quoted}” no dice de qué trata tu correo. Para tu jefa, un buen asunto es: “Solicitud de día libre – viernes 24”.` });
  } else if (mode === 'client' && !/\b(factura|invoice|bill)\b/.test(fold(subject))) {
    items.push({ ok: false, t: 'Asunto poco claro', d: `“${quoted}” no dice de qué trata tu correo. Para un cliente, un buen asunto es: “Factura n.º 1045”.` });
  } else {
    items.push({ ok: true, t: 'Asunto', d: `Escribiste un asunto: “${quoted}”. Así la otra persona sabe de qué trata antes de abrirlo.` });
  }

  items.push(...attCheck(message.atts, mode));

  if (kind === 'forward') {
    items.push({ ok: true, t: 'Mensaje reenviado', d: 'Reenviaste el mensaje original. Puedes agregar una nota arriba para explicar por qué lo envías.' });
    return { items, req: null };
  }

  if (!own) {
    items.push({ ok: false, t: 'Mensaje vacío', d: 'Enviaste el correo sin texto. Un mensaje corto explica qué necesitas o qué quieres decir.' });
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
