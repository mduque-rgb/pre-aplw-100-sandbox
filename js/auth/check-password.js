import { L } from '../shared/i18n.js';
import { TARGET_PASSWORD } from './credentials.js';

/** Password check: same result shape as checkEmail. Case matters here. */
export function checkPassword(value) {
  const target = TARGET_PASSWORD;

  if (!value) {
    return { i: 0, n: 0, t: L('Falta tu contraseña', 'Your password is missing'), m: L('El cuadro está vacío.', 'The box is empty.'), f: L('Toca el cuadro y escribe tu contraseña completa.', 'Tap the box and type your full password.') };
  }

  const space = value.search(/\s/);
  if (space > -1) {
    let length = 1;
    while (/\s/.test(value[space + length] || '')) length++;

    const message = space === 0
      ? L('Hay un espacio al principio de la contraseña.', 'There is a space at the start of the password.')
      : space + length === value.length
        ? L('Hay un espacio al final de la contraseña.', 'There is a space at the end of the password.')
        : L('Hay un espacio en medio de la contraseña.', 'There is a space in the middle of the password.');

    return { i: space, n: length, t: L('Sobra un espacio', 'Extra space'), m: message, f: L('Esta contraseña no lleva espacios. Bórralo con la tecla de borrar.', 'This password has no spaces. Delete it with the delete key.') };
  }

  if (value === target) return null;

  if (value.startsWith(target)) {
    const extra = value.length - target.length;
    return {
      i: target.length,
      n: extra,
      t: extra === 1 ? L('Sobra un carácter al final', 'Extra character at the end') : L('Sobran caracteres al final', 'Extra characters at the end'),
      m: L('La contraseña termina en el signo “!”. Después no va nada más.', 'The password ends with the “!” sign. Nothing else goes after it.'),
      f: L('Borra lo que está señalado.', 'Delete what is marked.'),
    };
  }

  if (target.startsWith(value)) {
    const missing = target.slice(value.length);
    const onlyBang = missing === '!';
    return {
      i: value.length,
      n: 0,
      t: L('Tu contraseña está incompleta', 'Your password is incomplete'),
      m: onlyBang
        ? L('Falta el signo de exclamación (!) al final.', 'The exclamation mark (!) is missing at the end.')
        : missing.length === 1
          ? L('Falta 1 carácter al final.', '1 character is missing at the end.')
          : L(`Faltan ${missing.length} caracteres al final.`, `${missing.length} characters are missing at the end.`),
      f: onlyBang
        ? L('Busca el ! en el teclado de símbolos (123 o #+=).', 'Find the ! on the symbols keyboard (123 or #+=).')
        : L('Sigue escribiendo. Revisa que no falte ninguna letra, número o símbolo.', 'Keep typing. Check that no letter, number or symbol is missing.'),
    };
  }

  let index = 0;
  while (index < value.length && value[index] === target[index]) index++;

  const typed = value[index];
  const expected = target[index];
  let title;
  let message;
  let fix;

  if (typed.toLowerCase() === expected.toLowerCase()) {
    const upper = expected !== expected.toLowerCase();
    title = upper ? L('Aquí va una MAYÚSCULA', 'A CAPITAL letter goes here') : L('Aquí va una minúscula', 'A small letter goes here');
    message = upper ? L('Esta letra debe ser mayúscula.', 'This letter must be a capital.') : L('Esta letra debe ser minúscula.', 'This letter must be small (lowercase).');
    fix = upper
      ? L('Toca la tecla ⇧ (Shift) y luego la letra. Borra la letra señalada y escríbela de nuevo.', 'Tap the ⇧ (Shift) key and then the letter. Delete the marked letter and type it again.')
      : L('Escribe esta letra en minúscula, sin tocar la tecla ⇧ (Shift).', 'Type this letter in lowercase, without tapping the ⇧ (Shift) key.');
  } else if (/\d/.test(expected)) {
    title = L('Aquí va un número', 'A number goes here');
    message = L('En este lugar va un número, no una letra ni un símbolo.', 'A number goes here, not a letter or a symbol.');
    fix = L('Cambia el carácter señalado por el número correcto.', 'Change the marked character to the right number.');
  } else if (/[A-Za-z]/.test(expected)) {
    title = L('Aquí va una letra', 'A letter goes here');
    message = L('En este lugar va una letra, no un número ni un símbolo.', 'A letter goes here, not a number or a symbol.');
    fix = L('Cambia el carácter señalado por la letra correcta.', 'Change the marked character to the right letter.');
  } else {
    title = L('Aquí va un símbolo', 'A symbol goes here');
    message = L('Aquí va el signo de exclamación (!).', 'The exclamation mark (!) goes here.');
    fix = L('Busca el ! en el teclado de símbolos (123 o #+=).', 'Find the ! on the symbols keyboard (123 or #+=).');
  }

  return { i: index, n: 1, t: title, m: message, f: fix };
}
