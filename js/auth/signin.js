import { esc } from '../shared/dom.js';
import { TARGET_EMAIL, TARGET_PASSWORD } from './credentials.js';
import { checkEmail } from './check-email.js';
import { checkPassword } from './check-password.js';

const measureCtx = document.createElement('canvas').getContext('2d');

function textWidth(input, text) {
  const style = getComputedStyle(input);
  measureCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return measureCtx.measureText(text).width;
}

export function bindSignin(page, { onAuthenticated, onBack }) {
  const form = page.querySelector('#signin-form');
  if (!form) return;

  const email = page.querySelector('#signin-email');
  const error = page.querySelector('#signin-err');
  const field = page.querySelector('#signin-field');
  const tip = page.querySelector('#signin-tip');
  const showPassword = page.querySelector('#show-pw');
  const showPasswordBox = page.querySelector('#show-pw-box');
  const passwordHint = page.querySelector('#pw-hint');
  const banner = page.querySelector('#signin-banner');
  let step = 1;

  const updateHint = () => {
    passwordHint.hidden = !(step === 2 && !showPasswordBox.checked && tip.hidden);
  };

  const hideTip = () => {
    tip.hidden = true;
    field.classList.remove('has-tip');
    updateHint();
  };

  const showTip = (result) => {
    error.textContent = '';
    const note = page.querySelector('#tip-note');
    if (step === 2) {
      email.type = 'text';
      showPasswordBox.checked = true;
      note.textContent = 'Mostramos tu contraseña para que puedas ver el error.';
      note.hidden = false;
    } else {
      note.hidden = true;
    }

    page.querySelector('#tip-title').textContent = result.t;
    page.querySelector('#tip-msg').textContent = result.m;
    page.querySelector('#tip-fix').innerHTML = `<strong>Qué hacer:</strong> ${esc(result.f)}`;
    field.classList.add('has-tip');
    tip.hidden = false;
    updateHint();

    const value = email.value;
    const style = getComputedStyle(email);
    const x0 = textWidth(email, value.slice(0, result.i));
    const x1 = textWidth(email, value.slice(0, result.i + result.n));
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
    const max = field.clientWidth - parseFloat(style.fontSize);
    const arrowX = Math.max(parseFloat(style.fontSize), Math.min(max, padding + (x0 + x1) / 2 - email.scrollLeft));
    tip.style.setProperty('--ax', `${arrowX}px`);

    email.focus({ preventScroll: true });
    try {
      email.setSelectionRange(result.i, result.i + result.n);
    } catch (_) {
      // Some input types do not support selection ranges.
    }
    tip.scrollIntoView({ block: 'nearest' });
  };

  const goPassword = (address) => {
    step = 2;
    hideTip();
    error.textContent = '';
    page.querySelector('#card-h1').textContent = 'Welcome';
    page.querySelector('#card-sub').hidden = true;
    page.querySelector('#who-mail').textContent = address;
    page.querySelector('#who-av').textContent = address.charAt(0).toUpperCase();
    page.querySelector('#who').hidden = false;
    email.type = 'password';
    email.value = '';
    email.setAttribute('inputmode', 'text');
    page.querySelector('#signin-label').textContent = 'Enter your password';
    showPasswordBox.checked = false;
    showPassword.hidden = false;
    page.querySelector('#tip-example').textContent = TARGET_PASSWORD;
    banner.innerHTML = `Practice page. Nothing you type here is sent anywhere. Practice password / Contraseña de práctica: <b>${TARGET_PASSWORD}</b>`;
    page.querySelector('#forgot-email').textContent = 'Forgot password?';
    page.querySelector('#create-account').textContent = 'Back';
    page.querySelector('#card-help').textContent = 'Your password stays hidden as you type. Tap “Show password” to check what you typed.';
    updateHint();
    email.focus();
    passwordHint.scrollIntoView({ block: 'nearest' });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = email.value;
    const result = step === 1 ? checkEmail(value) : checkPassword(value);
    if (result) {
      showTip(result);
      return;
    }

    hideTip();
    error.textContent = '';
    if (step === 1) {
      goPassword(value.trim());
      return;
    }

    onAuthenticated(page.querySelector('#who-mail').textContent);
  });

  email.addEventListener('input', () => {
    error.textContent = '';
    hideTip();
  });

  page.querySelector('#tip-ok').addEventListener('click', () => {
    hideTip();
    email.focus();
  });

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !tip.hidden) hideTip();
  });

  banner.innerHTML = `Practice page. Nothing you type here is sent anywhere. Practice email / Correo de práctica: <b>${TARGET_EMAIL}</b>`;

  showPasswordBox.addEventListener('change', () => {
    email.type = showPasswordBox.checked ? 'text' : 'password';
    updateHint();
    email.focus();
  });

  page.querySelector('#forgot-email').addEventListener('click', () => {
    hideTip();
    error.textContent = step === 1
      ? 'In the real app this helps you recover your address. Here, just type nicestudent@gmail.com.'
      : 'In the real app this helps you reset your password. Here, just type the practice password shown above.';
  });

  page.querySelector('#create-account').addEventListener('click', () => {
    if (step === 2) {
      onBack();
      return;
    }
    hideTip();
    error.textContent = 'Account creation isn’t part of this practice yet.';
  });
}
