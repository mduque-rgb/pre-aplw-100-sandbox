import { TARGET_EMAIL } from './credentials.js';

/**
 * Returns null when the address is right, otherwise:
 * { i: mistake index, n: covered characters, t: title, m: message, f: fix }.
 */
export function checkEmail(value) {
  const target = TARGET_EMAIL;
  const lower = value.toLowerCase();

  if (!value.trim()) {
    return { i: 0, n: 0, t: 'Falta tu correo', m: 'El cuadro está vacío.', f: 'Toca el cuadro y escribe tu correo electrónico completo.' };
  }

  const space = value.search(/\s/);
  if (space > -1) {
    let length = 1;
    while (/\s/.test(value[space + length] || '')) length++;

    const at = value.indexOf('@');
    const nearAt = at > -1 && (space + length === at || space === at + 1);
    let message;
    if (space === 0) message = 'Hay un espacio al principio del correo.';
    else if (space + length === value.length) message = 'Hay un espacio al final del correo.';
    else if (nearAt) message = 'Hay un espacio junto al símbolo @.';
    else message = 'Hay un espacio en medio del correo.';

    return { i: space, n: length, t: 'Sobra un espacio', m: message, f: 'Un correo nunca lleva espacios. Borra el espacio señalado con la tecla de borrar.' };
  }

  const at = value.indexOf('@');
  if (at < 0) {
    const gmail = lower.indexOf('gmail');
    return { i: gmail > 0 ? gmail : value.length, n: 0, t: 'Falta el símbolo @', m: 'No veo el @ que separa tu nombre de “gmail.com”.', f: 'Toca la tecla de números o símbolos del teclado (123 o #+=) y busca el @.' };
  }

  const secondAt = value.indexOf('@', at + 1);
  if (secondAt > -1) return { i: secondAt, n: 1, t: 'Hay dos símbolos @', m: 'Un correo lleva un solo @.', f: 'Borra el @ que sobra.' };
  if (at === 0) return { i: 0, n: 0, t: 'Falta tu nombre de usuario', m: 'Antes del @ debe ir tu nombre de usuario.', f: 'Escribe “nicestudent” antes del @.' };
  if (at === value.length - 1) return { i: value.length, n: 0, t: 'Falta lo que va después del @', m: 'El correo se quedó sin su parte final.', f: 'Después del @ escribe gmail.com.' };

  if (lower.startsWith(target) && value.length > target.length) {
    const extra = value.slice(target.length);
    const dots = /^\.+$/.test(extra);
    return {
      i: target.length,
      n: extra.length,
      t: dots ? 'Sobra un punto al final' : 'Sobran letras al final',
      m: dots ? 'Después de “.com” no va ningún punto.' : 'Después de “.com” no debe ir nada más.',
      f: 'Borra lo que está señalado.',
    };
  }

  const doubleDot = value.indexOf('..');
  if (doubleDot > -1) return { i: doubleDot, n: 2, t: 'Hay dos puntos seguidos', m: 'Entre “gmail” y “com” va un solo punto.', f: 'Borra uno de los puntos.' };

  if (target.startsWith(lower) && lower.length < target.length) {
    const domain = value.slice(at + 1);
    const noDot = !domain.includes('.');
    return {
      i: value.length,
      n: 0,
      t: 'Tu correo está incompleto',
      m: noDot ? 'Falta el punto y el final “com”.' : 'Falta la última parte del correo.',
      f: noDot ? 'Después de “gmail” escribe un punto y “com”: .com' : 'Revisa que el correo termine en .com',
    };
  }

  if (lower !== target) {
    let index = 0;
    while (index < lower.length && lower[index] === target[index]) index++;
    return { i: index, n: 1, t: 'Revisa esta letra', m: 'Hay una letra que no coincide con el correo de práctica.', f: 'Compara tu correo letra por letra con el ejemplo y corrige la parte señalada.' };
  }

  return null;
}
