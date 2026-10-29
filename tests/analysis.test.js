import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, listEs } from '../js/mail/domain/analysis.js';

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

test('listEs joins short and long lists naturally', () => {
  assert.equal(listEs([]), '');
  assert.equal(listEs(['uno']), 'uno');
  assert.equal(listEs(['uno', 'dos']), 'uno y dos');
  assert.equal(listEs(['uno', 'dos', 'tres']), 'uno, dos y tres');
});
