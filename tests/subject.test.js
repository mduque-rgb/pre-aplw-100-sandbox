import assert from 'node:assert/strict';
import test from 'node:test';

import { analyze, subjectIsClear } from '../js/mail/domain/analysis.js';

const BOSS_CLEAR = [
  'Solicitud de día libre', 'Permiso para el viernes', 'Solicito el viernes', 'Ausencia el viernes',
  'Ausentarme el viernes', 'Descanso el viernes 24', 'Cita médica el viernes', 'Licencia por cita médica',
  'Pedido de permiso', 'Faltaré el viernes', 'Viernes 24 de octubre', 'Time off request', 'Vacaciones',
  'Days off next week', 'Petición', 'Día libre',
];
const CLIENT_CLEAR = [
  'Factura n.º 1045', 'Facturas', 'Facturación de octubre', 'Factura1045', 'Invoice #1045', 'Invoices',
  'Billing', 'Recibo 1045', 'Su factura', 'Documento solicitado: 1045', 'Pago pendiente n.º 1045', 'Fact. 1045',
];

test('subjects people really write for the day-off email are accepted', () => {
  for (const subject of BOSS_CLEAR) assert.ok(subjectIsClear(subject, 'boss'), subject);
});

test('subjects people really write for the invoice email are accepted', () => {
  for (const subject of CLIENT_CLEAR) assert.ok(subjectIsClear(subject, 'client'), subject);
});

test('vague subjects are still noticed', () => {
  assert.equal(subjectIsClear('Hola', 'boss'), false);
  assert.equal(subjectIsClear('Una pregunta', 'boss'), false);
  assert.equal(subjectIsClear('Hola Carlos', 'client'), false);
  assert.equal(subjectIsClear('Documento', 'client'), false);
});

const subjectItem = (subject, mode) => analyze({ subject, to: 'a@b.com', atts: [] }, 'new', 'hola', mode)
  .items.find((item) => /asunto/i.test(item.t));

test('a vague subject is a tip that does not block the step', () => {
  const item = subjectItem('Hola', 'boss');
  assert.equal(item.ok, true);
  assert.equal(item.tip, true);
  assert.equal(item.t, 'Asunto poco claro');
});

test('missing, all-caps and too-long subjects still block', () => {
  assert.equal(subjectItem('(no subject)', 'boss').ok, false);
  assert.equal(subjectItem('PERMISO', 'boss').ok, false);
  assert.equal(subjectItem('Solicitud de día libre para el viernes 24 de octubre por una cita', 'boss').ok, false);
});
