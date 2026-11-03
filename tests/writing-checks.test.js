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

const problemIds = (text, mode) => writingChecks(text, mode).items.filter((item) => !item.ok).map((item) => item.id);

test('real words are never reported as glued words', () => {
  const words = [
    // English words that split into shorter known words.
    'late', 'note', 'idea', 'area', 'side', 'theme', 'queen', 'formal', 'forget', 'delete', 'panel', 'estate', 'versus',
    'anyone', 'someday', 'somewhere', 'overall', 'overnight', 'weekday', 'without', 'myself', 'often', 'awesome', 'fourteen',
    // Spanish words that split into shorter known words.
    'sino', 'tuya', 'tuyo', 'deme', 'media', 'medias', 'nota', 'ellos', 'ellas', 'temas', 'ahora', 'ademas', 'conmigo',
  ];
  for (const word of words) {
    const text = `Hi Sofía,\n\nYes, I will be there on Sunday. ${word}\n\nHugs,\nAna`;
    assert.equal(problemIds(text, 'sofia').includes('GLUED_WORDS'), false, word);
  }
});

test('words really stuck together are still reported', () => {
  for (const glued of ['sivoy', 'yovoy', 'thankyou', 'seeyou', 'nosvemos', 'porfavor', 'eldomingo', 'muchasgracias', 'iwill']) {
    const text = `Hi Sofía,\n\nYes, I will be there on Sunday. ${glued}\n\nHugs,\nAna`;
    assert.equal(problemIds(text, 'sofia').includes('GLUED_WORDS'), true, glued);
  }
});

test('email and web addresses are not glued words, and contact lines do not hide the signature', () => {
  const email = 'Dear Carlos,\n\nPlease find attached invoice #1045. More at www.example.com.\n\nKind regards,\nAna Pérez\nana.perez@gmail.com\nTel: 555-123-4567';
  assert.deepEqual(problemIds(email, 'client'), []);
  assert.equal(writingChecks(email, 'client').req.bye, true);
});

test('common ways to write the day-off request in English are understood', () => {
  const bodies = [
    'I would like to ask for Friday off because I have a doctor’s appointment.',
    'I need Friday off, please. I have a medical appointment.',
    'Could I have Friday off? I have to take my son to the dentist.',
    'Would you let me take Friday off? My daughter is sick.',
    'I am writing to ask if I could take Friday off for a personal matter.',
  ];
  for (const body of bodies) {
    const email = `Dear Laura,\n\n${body}\n\nKind regards,\nAna`;
    assert.deepEqual(problemIds(email, 'boss'), [], body);
  }
});

test('an English email that asks for nothing is still missing the request', () => {
  const ids = problemIds('Dear Laura,\n\nI hope you are well. Friday is a busy day.\n\nKind regards,\nAna', 'boss');
  assert.equal(ids.includes('NO_REQUEST'), true);
  assert.equal(ids.includes('NO_REASON'), true);
});

test('common ways to mention the attachment are understood', () => {
  const bodies = [
    'I am sending you invoice #1045.',
    'I’m sending you invoice #1045.',
    'You will find invoice #1045 attached.',
    'Here you have invoice #1045.',
    'Le remito la factura n.º 1045.',
  ];
  for (const body of bodies) {
    const ids = problemIds(`Dear Carlos,\n\n${body}\n\nKind regards,\nAna`, 'client');
    assert.equal(ids.includes('NO_ATTACHMENT_MENTION'), false, body);
  }
});

const sofiaAnswer = (body) => writingChecks(`Hola Sofía,\n\n${body}\n\nUn abrazo,\nAna`, 'sofia');
const answerText = (result) => result.items.find((item) => item.id === 'NO_ANSWER' || item.t === 'Respuesta a su pregunta').d;

test('clear yes and no answers to Sofía are accepted', () => {
  const answers = [
    'Sí, estaré ahí el domingo.', 'Si, estaré ahí el domingo.', '¡Sí! Me encantaría ir a cenar.', 'Si, claro que voy.',
    'Sí voy a ir a la cena.', 'Claro que sí, nos vemos el domingo.', 'Yes, I will be there on Sunday.',
    'Sorry for the late reply! Yes, I will be there on Sunday.', 'I can’t wait to see you on Sunday!',
    'Sí, iré. Quizás llegue un poco tarde.', 'Yes! Maybe I can bring dessert.',
    'Lo siento, no podré ir el domingo.', 'Sorry, I can’t come on Sunday.', 'No puedo ir, tengo que trabajar.',
    'Sorry, I won’t be able to come for dinner on Sunday.',
    // No accent: many tablets have no Spanish keyboard.
    'Si puedo ir, ¡gracias por invitarme!', 'Si voy a ir a la cena.', 'Pues si, voy.', 'Creo que si, nos vemos el domingo.',
  ];
  for (const body of answers) assert.equal(sofiaAnswer(body).req.answer, true, body);
});

test('unsure replies to Sofía are not counted as an answer', () => {
  const unsure = [
    'No sé si puedo ir el domingo.', 'No sé si iré el domingo.', 'Quizá voy a la cena del domingo.', 'A ver si puedo ir el domingo.',
    'Tal vez vaya a la cena.', 'No estoy segura de si podré ir.', 'Te aviso si puedo ir.', 'Me pregunto si podré ir.',
    'Depende de mi trabajo, te aviso.', 'I don’t know if I can come on Sunday.', 'Maybe I will come on Sunday.',
    'I’m not sure I can make it on Sunday.', 'Sorry, I don’t know if I can come.',
  ];
  for (const body of unsure) {
    const result = sofiaAnswer(body);
    assert.equal(result.req.answer, false, body);
    assert.match(answerText(result), /no deja claro/, body);
  }
});

test('“si” without an accent is accepted, with an optional tip about “sí”', () => {
  for (const body of ['Si puedo ir, ¡gracias por invitarme!', 'Si, claro que voy.']) {
    const result = sofiaAnswer(body);
    assert.equal(result.req.answer, true, body);
    assert.match(answerText(result), /teclado lo permite/, body);
  }
  assert.doesNotMatch(answerText(sofiaAnswer('Sí, claro que voy.')), /teclado/);
  assert.doesNotMatch(answerText(sofiaAnswer('No sé si puedo ir el domingo.')), /tilde/);
});

test('a short “Yes” quotes the future verb that follows it', () => {
  assert.match(answerText(sofiaAnswer('Sorry for the late reply! Yes, I will be there on Sunday.')), /“I will be there”/);
});
