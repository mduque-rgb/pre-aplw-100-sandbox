import { learner } from '../learner/state.js';
import { $m } from '../shared/dom.js';
import { L, onLangChange } from '../shared/i18n.js';
import { guide } from './guide.js';

const clean = (value) => value.replace(/\s+/g, ' ').trim();

/**
 * @typedef {Object} WelcomeOptions
 * @property {{name: string, step: number, done: boolean}|null} [resume]  Saved practice to offer.
 * @property {() => void} [onContinue]  Restore the saved practice.
 * @property {() => void} [onRestart]   Forget the saved practice.
 * @property {() => void} [onStart]     A new learner entered their name.
 */

/** @param {WelcomeOptions} [options] */
export function bindWelcome(options = {}) {
  const welcome = $m('welcome');
  const form = $m('wl-form');
  const first = /** @type {HTMLInputElement} */ ($m('wl-first'));
  const last = /** @type {HTMLInputElement} */ ($m('wl-last'));
  const error = $m('wl-err');
  const resumeBox = $m('wl-resume');
  const newBox = $m('wl-new');
  let { resume } = options;

  const showError = (message, input) => {
    error.textContent = message;
    error.hidden = false;
    input.classList.add('bad');
    input.focus();
  };

  const resumeText = () => (resume
    ? resume.done
      ? L(`¡Hola de nuevo, ${resume.name}! Ya terminaste la práctica. Puedes volver a ver tu informe o empezar de nuevo.`, `Welcome back, ${resume.name}! You already finished the practice. You can see your report again or start over.`)
      : L(`¡Hola de nuevo, ${resume.name}! Te quedaste en el paso ${resume.step} de 7.`, `Welcome back, ${resume.name}! You stopped at step ${resume.step} of 7.`)
    : '');

  const showMode = () => {
    resumeBox.hidden = !resume;
    newBox.hidden = Boolean(resume);
    $m('wl-resume-text').textContent = resumeText();
  };

  const close = () => {
    welcome.hidden = true;
    guide.start();
  };

  [first, last].forEach((input) => {
    input.addEventListener('input', () => {
      error.hidden = true;
      input.classList.remove('bad');
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (resume) return;
    const firstName = clean(first.value);
    const lastName = clean(last.value);

    if (!firstName) {
      showError(L('Falta tu nombre. Escríbelo en el primer cuadro, por ejemplo: María.', 'Your first name is missing. Type it in the first box, for example: Maria.'), first);
      return;
    }
    if (!lastName) {
      showError(L('Falta tu apellido. Escríbelo en el segundo cuadro, por ejemplo: López.', 'Your last name is missing. Type it in the second box, for example: Lopez.'), last);
      return;
    }

    learner.first = firstName;
    learner.last = lastName;
    options.onStart?.();
    close();
  });

  $m('wl-continue').addEventListener('click', () => {
    options.onContinue?.();
    close();
  });

  $m('wl-restart').addEventListener('click', () => {
    options.onRestart?.();
    resume = null;
    showMode();
    first.focus();
  });

  onLangChange(showMode);
  showMode();
  setTimeout(() => (resume ? $m('wl-continue') : first).focus(), 50);
}
