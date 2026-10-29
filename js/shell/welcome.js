import { learner } from '../learner/state.js';
import { $m } from '../shared/dom.js';
import { guide } from './guide.js';

const clean = (value) => value.replace(/\s+/g, ' ').trim();

export function bindWelcome() {
  const welcome = $m('welcome');
  const form = $m('wl-form');
  const first = /** @type {HTMLInputElement} */ ($m('wl-first'));
  const last = /** @type {HTMLInputElement} */ ($m('wl-last'));
  const error = $m('wl-err');

  const showError = (message, input) => {
    error.textContent = message;
    error.hidden = false;
    input.classList.add('bad');
    input.focus();
  };

  [first, last].forEach((input) => {
    input.addEventListener('input', () => {
      error.hidden = true;
      input.classList.remove('bad');
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstName = clean(first.value);
    const lastName = clean(last.value);

    if (!firstName) {
      showError('Falta tu nombre. Escríbelo en el primer cuadro, por ejemplo: María.', first);
      return;
    }
    if (!lastName) {
      showError('Falta tu apellido. Escríbelo en el segundo cuadro, por ejemplo: López.', last);
      return;
    }

    learner.first = firstName;
    learner.last = lastName;
    welcome.hidden = true;
    guide.start();
  });

  setTimeout(() => first.focus(), 50);
}
