import { L } from '../shared/i18n.js';
import { TARGET_EMAIL } from './credentials.js';

/**
 * Returns null when the address is right, otherwise:
 * { i: mistake index, n: covered characters, t: title, m: message, f: fix }.
 */
export function checkEmail(value) {
  const target = TARGET_EMAIL;
  const lower = value.toLowerCase();

  if (!value.trim()) {
    return { i: 0, n: 0, t: L('Falta tu correo', 'Your email is missing'), m: L('El cuadro está vacío.', 'The box is empty.'), f: L('Toca el cuadro y escribe tu correo electrónico completo.', 'Tap the box and type your full email address.') };
  }

  const space = value.search(/\s/);
  if (space > -1) {
    let length = 1;
    while (/\s/.test(value[space + length] || '')) length++;

    const at = value.indexOf('@');
    const nearAt = at > -1 && (space + length === at || space === at + 1);
    let message;
    if (space === 0) message = L('Hay un espacio al principio del correo.', 'There is a space at the start of the email.');
    else if (space + length === value.length) message = L('Hay un espacio al final del correo.', 'There is a space at the end of the email.');
    else if (nearAt) message = L('Hay un espacio junto al símbolo @.', 'There is a space next to the @ sign.');
    else message = L('Hay un espacio en medio del correo.', 'There is a space in the middle of the email.');

    return { i: space, n: length, t: L('Sobra un espacio', 'Extra space'), m: message, f: L('Un correo nunca lleva espacios. Borra el espacio señalado con la tecla de borrar.', 'An email address never has spaces. Delete the marked space with the delete key.') };
  }

  const at = value.indexOf('@');
  if (at < 0) {
    const gmail = lower.indexOf('gmail');
    return { i: gmail > 0 ? gmail : value.length, n: 0, t: L('Falta el símbolo @', 'The @ sign is missing'), m: L('No veo el @ que separa tu nombre de “gmail.com”.', 'I can’t see the @ that separates your name from “gmail.com”.'), f: L('Toca la tecla de números o símbolos del teclado (123 o #+=) y busca el @.', 'Tap the numbers or symbols key on the keyboard (123 or #+=) and find the @.') };
  }

  const secondAt = value.indexOf('@', at + 1);
  if (secondAt > -1) return { i: secondAt, n: 1, t: L('Hay dos símbolos @', 'There are two @ signs'), m: L('Un correo lleva un solo @.', 'An email address has only one @.'), f: L('Borra el @ que sobra.', 'Delete the extra @.') };
  if (at === 0) return { i: 0, n: 0, t: L('Falta tu nombre de usuario', 'Your user name is missing'), m: L('Antes del @ debe ir tu nombre de usuario.', 'Your user name goes before the @.'), f: L('Escribe “nicestudent” antes del @.', 'Type “nicestudent” before the @.') };
  if (at === value.length - 1) return { i: value.length, n: 0, t: L('Falta lo que va después del @', 'The part after the @ is missing'), m: L('El correo se quedó sin su parte final.', 'The email address is missing its last part.'), f: L('Después del @ escribe gmail.com.', 'After the @ type gmail.com.') };

  if (lower.startsWith(target) && value.length > target.length) {
    const extra = value.slice(target.length);
    const dots = /^\.+$/.test(extra);
    return {
      i: target.length,
      n: extra.length,
      t: dots ? L('Sobra un punto al final', 'Extra dot at the end') : L('Sobran letras al final', 'Extra letters at the end'),
      m: dots ? L('Después de “.com” no va ningún punto.', 'No dot goes after “.com”.') : L('Después de “.com” no debe ir nada más.', 'Nothing else goes after “.com”.'),
      f: L('Borra lo que está señalado.', 'Delete what is marked.'),
    };
  }

  const doubleDot = value.indexOf('..');
  if (doubleDot > -1) return { i: doubleDot, n: 2, t: L('Hay dos puntos seguidos', 'There are two dots in a row'), m: L('Entre “gmail” y “com” va un solo punto.', 'Only one dot goes between “gmail” and “com”.'), f: L('Borra uno de los puntos.', 'Delete one of the dots.') };

  if (target.startsWith(lower) && lower.length < target.length) {
    const domain = value.slice(at + 1);
    const noDot = !domain.includes('.');
    return {
      i: value.length,
      n: 0,
      t: L('Tu correo está incompleto', 'Your email is incomplete'),
      m: noDot ? L('Falta el punto y el final “com”.', 'The dot and the ending “com” are missing.') : L('Falta la última parte del correo.', 'The last part of the email is missing.'),
      f: noDot ? L('Después de “gmail” escribe un punto y “com”: .com', 'After “gmail” type a dot and “com”: .com') : L('Revisa que el correo termine en .com', 'Check that the email ends in .com'),
    };
  }

  if (lower !== target) {
    let index = 0;
    while (index < lower.length && lower[index] === target[index]) index++;
    return { i: index, n: 1, t: L('Revisa esta letra', 'Check this letter'), m: L('Hay una letra que no coincide con el correo de práctica.', 'One letter does not match the practice email.'), f: L('Compara tu correo letra por letra con el ejemplo y corrige la parte señalada.', 'Compare your email letter by letter with the example and fix the marked part.') };
  }

  return null;
}
