import assert from 'node:assert/strict';
import test from 'node:test';
import { checkEmail } from '../js/auth/check-email.js';
import { checkPassword } from '../js/auth/check-password.js';

const EMAIL = 'nicestudent@gmail.com';
const PASSWORD = 'L3arn7inG2026!';

test('checkEmail accepts the practice address', () => {
  assert.equal(checkEmail(EMAIL), null);
});

test('checkEmail explains missing @ and incomplete domain', () => {
  assert.equal(checkEmail('nicestudentgmail.com').t, 'Falta el símbolo @');
  assert.equal(checkEmail('nicestudent@gmail').t, 'Tu correo está incompleto');
});

test('checkEmail flags spaces and extra characters', () => {
  assert.equal(checkEmail('nice student@gmail.com').t, 'Sobra un espacio');
  assert.equal(checkEmail(`${EMAIL}.`).t, 'Sobra un punto al final');
});

test('checkPassword accepts the practice password and preserves case', () => {
  assert.equal(checkPassword(PASSWORD), null);
  assert.equal(checkPassword(PASSWORD.toLowerCase()).t.includes('MAYÚSCULA'), true);
});

test('checkPassword explains missing symbol and extra characters', () => {
  assert.equal(checkPassword(PASSWORD.slice(0, -1)).t, 'Tu contraseña está incompleta');
  assert.equal(checkPassword(`${PASSWORD}!`).t, 'Sobra un carácter al final');
});
