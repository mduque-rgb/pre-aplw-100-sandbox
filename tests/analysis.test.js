import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, listText } from '../js/mail/domain/analysis.js';

const body = 'Estimado Carlos:\n\nLe adjunto la factura n.º 1045.\n\nSaludos cordiales,\nAna';
const message = (atts, subject = 'Factura n.º 1045') => ({
  to: 'carlos.rivera@cliente.com',
  subject,
  atts,
});

const badItems = (result) => result.items.filter((item) => !item.ok).map((item) => item.t);

test('a client message with the right invoice passes every check', () => {
  const result = analyze(message(['Factura_1045_Rivera.pdf']), 'new', body, 'client');

  assert.deepEqual(badItems(result), []);
});

test('a client message without an attachment is rejected', () => {
  const result = analyze(message([]), 'new', body, 'client');

  assert.equal(badItems(result).includes('Falta el archivo adjunto'), true);
});

test('a client message with another invoice is rejected', () => {
  const result = analyze(message(['Factura_1044_Gomez.pdf']), 'new', body, 'client');

  assert.equal(badItems(result).includes('Archivo equivocado'), true);
});

test('a client message with extra files is rejected', () => {
  const result = analyze(message(['Factura_1045_Rivera.pdf', 'Foto_vacaciones.jpg']), 'new', body, 'client');

  assert.equal(badItems(result).includes('Archivos de más'), true);
});

test('missing subject and empty message are reported', () => {
  const result = analyze({ ...message([]), subject: '(no subject)' }, 'reply', '', '');

  assert.equal(badItems(result).includes('Falta el asunto'), true);
  assert.equal(badItems(result).includes('Mensaje vacío'), true);
  assert.equal(result.req, null);
});

test('forwarded messages skip body requirements', () => {
  const result = analyze(message([], 'Fwd: hello'), 'forward', '', '');

  assert.equal(result.items.some((item) => item.t === 'Mensaje reenviado'), true);
  assert.equal(result.req, null);
});

test('listText joins short and long lists naturally', () => {
  assert.equal(listText([]), '');
  assert.equal(listText(['uno']), 'uno');
  assert.equal(listText(['uno', 'dos']), 'uno y dos');
  assert.equal(listText(['uno', 'dos', 'tres']), 'uno, dos y tres');
});

test('feedback is written in English when English is chosen', async () => {
  const { setLangForTests } = await import('../js/shared/i18n.js');
  setLangForTests('en');
  try {
    const { items } = analyze({ subject: '(no subject)', to: 'a@b.com', atts: [] }, 'new', 'hello', 'boss');
    const subject = items.find((item) => item.id === 'NO_SUBJECT');
    assert.equal(subject.t, 'Missing subject');
    assert.match(subject.d, /without a subject/);
    assert.equal(listText(['a', 'b', 'c']), 'a, b and c');
  } finally {
    setLangForTests('es');
  }
});
