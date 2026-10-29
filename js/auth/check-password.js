import { TARGET_PASSWORD } from './credentials.js';

/** Password check: same result shape as checkEmail. Case matters here. */
export function checkPassword(value) {
  const target = TARGET_PASSWORD;

  if (!value) {
    return { i: 0, n: 0, t: 'Falta tu contraseña', m: 'El cuadro está vacío.', f: 'Toca el cuadro y escribe tu contraseña completa.' };
  }

  const space = value.search(/\s/);
  if (space > -1) {
    let length = 1;
    while (/\s/.test(value[space + length] || '')) length++;

    const message = space === 0
      ? 'Hay un espacio al principio de la contraseña.'
      : space + length === value.length
        ? 'Hay un espacio al final de la contraseña.'
        : 'Hay un espacio en medio de la contraseña.';

    return { i: space, n: length, t: 'Sobra un espacio', m: message, f: 'Esta contraseña no lleva espacios. Bórralo con la tecla de borrar.' };
  }

  if (value === target) return null;

  if (value.startsWith(target)) {
    const extra = value.length - target.length;
    return {
      i: target.length,
      n: extra,
      t: extra === 1 ? 'Sobra un carácter al final' : 'Sobran caracteres al final',
      m: 'La contraseña termina en el signo “!”. Después no va nada más.',
      f: 'Borra lo que está señalado.',
    };
  }

  if (target.startsWith(value)) {
    const missing = target.slice(value.length);
    const onlyBang = missing === '!';
    return {
      i: value.length,
      n: 0,
      t: 'Tu contraseña está incompleta',
      m: onlyBang
        ? 'Falta el signo de exclamación (!) al final.'
        : missing.length === 1
          ? 'Falta 1 carácter al final.'
          : `Faltan ${missing.length} caracteres al final.`,
      f: onlyBang
        ? 'Busca el ! en el teclado de símbolos (123 o #+=).'
        : 'Sigue escribiendo. Revisa que no falte ninguna letra, número o símbolo.',
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
    title = upper ? 'Aquí va una MAYÚSCULA' : 'Aquí va una minúscula';
    message = upper ? 'Esta letra debe ser mayúscula.' : 'Esta letra debe ser minúscula.';
    fix = upper
      ? 'Toca la tecla ⇧ (Shift) y luego la letra. Borra la letra señalada y escríbela de nuevo.'
      : 'Escribe esta letra en minúscula, sin tocar la tecla ⇧ (Shift).';
  } else if (/\d/.test(expected)) {
    title = 'Aquí va un número';
    message = 'En este lugar va un número, no una letra ni un símbolo.';
    fix = 'Cambia el carácter señalado por el número correcto.';
  } else if (/[A-Za-z]/.test(expected)) {
    title = 'Aquí va una letra';
    message = 'En este lugar va una letra, no un número ni un símbolo.';
    fix = 'Cambia el carácter señalado por la letra correcta.';
  } else {
    title = 'Aquí va un símbolo';
    message = 'Aquí va el signo de exclamación (!).';
    fix = 'Busca el ! en el teclado de símbolos (123 o #+=).';
  }

  return { i: index, n: 1, t: title, m: message, f: fix };
}
