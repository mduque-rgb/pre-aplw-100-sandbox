import assert from 'node:assert/strict';
import test from 'node:test';

import { subjectIsClear } from '../js/mail/domain/analysis.js';
import { writingChecks } from '../js/mail/domain/writing-checks.js';

/*
 * Every sentence the feedback suggests to the learner, in both languages.
 * If a learner copies the app's own advice, the step must pass.
 * When you add or change an example in writing-checks.js or analysis.js, add it here too.
 */
const EXAMPLES = {
  sofia: {
    es: {
      greet: ['Hola Sofía,'],
      body: [
        'Sí, estaré ahí el domingo.',
        '¡Sí, estaré ahí el domingo!',
        'Lo siento, no podré ir a cenar el domingo.',
        'Lo siento, no podré ir el domingo.',
      ],
      bye: ['Un abrazo,', 'Gracias,'],
    },
    en: {
      greet: ['Hi Sofía,'],
      body: [
        'Yes, I will be there on Sunday.',
        'Yes, I will be there on Sunday!',
        'Sorry, I won’t be able to come for dinner on Sunday.',
        'Sorry, I can’t come on Sunday.',
      ],
      bye: ['Hugs,', 'Thanks,'],
    },
  },
  boss: {
    es: {
      greet: ['Estimada Laura:', 'Buenos días, Laura:'],
      // Request example, then the reason example.
      body: ['Quisiera pedirle el viernes libre porque tengo una cita médica.'],
      bye: ['Saludos cordiales,', 'Atentamente,'],
    },
    en: {
      greet: ['Dear Laura,', 'Good morning, Laura,'],
      body: ['I would like to ask for Friday off because I have a doctor’s appointment.'],
      bye: ['Kind regards,', 'Sincerely,'],
    },
  },
  client: {
    es: {
      greet: ['Estimado Carlos:', 'Buenos días, Sr. Rivera:'],
      body: ['Le envío la factura n.º 1045.', 'Le adjunto la factura n.º 1045.'],
      bye: ['Saludos cordiales,', 'Atentamente,'],
    },
    en: {
      greet: ['Dear Carlos,', 'Good morning, Mr. Rivera,'],
      body: ['Please find invoice #1045 attached.', 'I have attached invoice #1045.'],
      bye: ['Kind regards,', 'Sincerely,'],
    },
  },
};

const problems = (text, mode) => writingChecks(text, mode).items.filter((item) => !item.ok).map((item) => item.id);

for (const [mode, languages] of Object.entries(EXAMPLES)) {
  for (const [lang, { greet, body, bye }] of Object.entries(languages)) {
    test(`emails built from the suggested ${mode} examples (${lang}) pass every check`, () => {
      for (const g of greet) {
        for (const b of body) {
          for (const c of bye) {
            const email = `${g}\n\n${b}\n\n${c}\nAna`;
            assert.deepEqual(problems(email, mode), [], email);
          }
        }
      }
    });
  }
}

test('the suggested date examples are recognised as a day', () => {
  for (const date of ['el viernes 24 de octubre', 'Friday, October 24']) {
    const result = writingChecks(`Dear Laura,\n\nI would like to ask for a day off on ${date} because I have an appointment.\n\nKind regards,\nAna`, 'boss');
    assert.equal(result.req.date, true, date);
  }
});

test('the suggested polite phrases are recognised as polite', () => {
  const phrases = ['¿Sería posible…?', 'Quisiera pedirle…', 'Le agradecería…', 'Would it be possible…?', 'I would like to ask…', 'I would appreciate…'];
  for (const phrase of phrases) {
    const email = `Dear Laura,\n\n${phrase} Friday off, because I have an appointment.\n\nKind regards,\nAna`;
    assert.equal(problems(email, 'boss').includes('NOT_POLITE'), false, phrase);
  }
});

test('the suggested subjects are clear', () => {
  assert.ok(subjectIsClear('Solicitud de día libre – viernes 24', 'boss'));
  assert.ok(subjectIsClear('Day off request – Friday 24', 'boss'));
  assert.ok(subjectIsClear('Factura n.º 1045', 'client'));
  assert.ok(subjectIsClear('Invoice #1045', 'client'));
});
