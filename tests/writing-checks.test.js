import assert from 'node:assert/strict';
import test from 'node:test';
import { fold, writingChecks } from '../js/mail/domain/writing-checks.js';

const badItems = (result) => result.items.filter((item) => !item.ok).map((item) => item.t);

test('fold removes accents and normalizes quotes', () => {
  assert.equal(fold('Sofía’s día'), "sofia's dia");
});

test('a complete reply to Sofía passes every check', () => {
  const result = writingChecks('Hola Sofía,\n\nSí, estaré ahí el domingo.\n\nUn abrazo,\nAna', 'sofia');

  assert.equal(result.req.greet, true);
  assert.equal(result.req.answer, true);
  assert.equal(result.req.bye, true);
  assert.deepEqual(badItems(result), []);
});

test('a complete boss request passes every check', () => {
  const result = writingChecks('Estimada Laura:\n\nQuisiera pedirle el viernes libre porque tengo una cita médica.\n\nSaludos cordiales,\nAna', 'boss');

  assert.equal(result.req.greet, true);
  assert.equal(result.req.request, true);
  assert.equal(result.req.date, true);
  assert.equal(result.req.bye, true);
  assert.deepEqual(badItems(result), []);
});

test('a complete client message passes every check', () => {
  const result = writingChecks('Estimado Carlos:\n\nLe adjunto la factura n.º 1045.\n\nSaludos cordiales,\nAna', 'client');

  assert.equal(result.req.invoice, true);
  assert.equal(result.req.attMention, true);
  assert.equal(result.req.bye, true);
  assert.deepEqual(badItems(result), []);
});

test('missing greeting, answer, day and goodbye are detected', () => {
  const sofia = writingChecks('Quizá voy a la cena del domingo. Chao.', 'sofia');
  const boss = writingChecks('Quisiera pedirle un día libre porque tengo una cita médica.', 'boss');

  assert.equal(sofia.req.greet, false);
  assert.equal(sofia.req.answer, false);
  assert.equal(boss.req.request, true);
  assert.equal(boss.req.date, false);
  assert.equal(boss.req.bye, false);
});

test('missing invoice mention and number are detected', () => {
  const result = writingChecks('Estimado Carlos:\n\nLe paso el documento.\n\nSaludos cordiales,\nAna', 'client');

  assert.equal(result.req.invoice, false);
  assert.equal(result.req.attMention, false);
  assert.equal(badItems(result).includes('Falta mencionar la factura'), true);
});

test('glued words and run-on sentences are reported', () => {
  const glued = writingChecks('HolaSofía, si voy a la cena.\nGracias, Ana', 'sofia');
  const runOn = writingChecks(`Hola Sofía,\n\n${'quiero ir a la cena y hablar contigo y comer sopa y ver fotos y '.repeat(3)}domingo.\n\nUn abrazo,\nAna`, 'sofia');

  assert.equal(badItems(glued).includes('Faltan espacios entre palabras'), true);
  assert.equal(badItems(runOn).includes('Oración demasiado larga'), true);
});
