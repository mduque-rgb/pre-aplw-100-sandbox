import assert from 'node:assert/strict';
import test from 'node:test';

import { PHISHING, SIGN_COUNT, SIGN_HINTS } from '../js/mail/data/phishing.js';
import { allFound, firstMissing, pieces, spotsFor } from '../js/mail/domain/inspect.js';
import { newMission, withFound } from '../js/mail/domain/mission-state.js';
import { setLangForTests, tx } from '../js/shared/i18n.js';

const fieldsOf = (phish) => ({ addr: phish.addr, subject: tx(phish.subject), body: tx(phish.body) });

/** Runs `check` in Spanish and in English. */
function inBothLanguages(check) {
  try {
    for (const lang of ['es', 'en']) {
      setLangForTests(lang);
      check(lang);
    }
  } finally {
    setLangForTests('es');
  }
}

test('every fake email has the six warning signs, each with a title, an explanation and somewhere to tap', () => {
  assert.equal(SIGN_HINTS.length, SIGN_COUNT);
  for (const phish of PHISHING) {
    assert.equal(phish.signs.length, SIGN_COUNT, phish.id);
    for (const sign of phish.signs) {
      assert.ok(sign.title.es && sign.title.en && sign.why.es && sign.why.en, phish.id);
      assert.ok(sign.spots.length >= 1, `${phish.id}: ${sign.title.en}`);
    }
  }
});

test('each spot appears exactly once in its field, in both languages', () => {
  inBothLanguages((lang) => {
    for (const phish of PHISHING) {
      const fields = fieldsOf(phish);
      for (const sign of phish.signs) {
        for (const place of sign.spots) {
          const text = tx(place.text);
          const times = fields[place.field].split(text).length - 1;
          assert.equal(times, 1, `${phish.id} (${lang}): “${text}” appears ${times} times in the ${place.field}`);
        }
      }
    }
  });
});

test('every sign of every fake email can be tapped, and the pieces rebuild the email exactly', () => {
  inBothLanguages((lang) => {
    for (const phish of PHISHING) {
      const tappable = new Set();
      for (const [field, text] of Object.entries(fieldsOf(phish))) {
        const parts = pieces(text, spotsFor(phish, /** @type {'addr'|'subject'|'body'} */ (field)));
        assert.equal(parts.map((piece) => piece.text).join(''), text, `${phish.id} (${lang}) ${field}`);
        parts.forEach((piece) => piece.sign !== null && piece.sign >= 0 && tappable.add(piece.sign));
      }
      assert.equal(tappable.size, SIGN_COUNT, `${phish.id} (${lang})`);
    }
  });
});

test('each fake email has a link that is only text, never a real address', () => {
  for (const phish of PHISHING) {
    const link = phish.signs[5].spots[0].text;
    assert.equal(typeof link, 'string');
    assert.match(/** @type {string} */ (link), /^www\.[\w-]+\.example\//, phish.id);
  }
});

test('normal text is split into sentences that can be tapped, with spaces left as plain text', () => {
  const parts = pieces('Hola: Te recordamos tu cita.\n\nGracias, Ana', []);
  assert.deepEqual(parts, [
    { text: 'Hola:', sign: -1 },
    { text: ' ', sign: null },
    { text: 'Te recordamos tu cita.', sign: -1 },
    { text: '\n\n', sign: null },
    { text: 'Gracias, Ana', sign: -1 },
  ]);
});

test('a spot becomes its own piece, even in the middle of a sentence', () => {
  const parts = pieces('Para reclamar, responde con tu contraseña hoy.', [{ text: 'responde con tu contraseña', sign: 4 }]);
  assert.deepEqual(parts.filter((piece) => piece.sign !== null), [
    { text: 'Para reclamar,', sign: -1 },
    { text: 'responde con tu contraseña', sign: 4 },
    { text: 'hoy.', sign: -1 },
  ]);
});

test('real emails have no spots, so nothing in them counts as a sign', () => {
  assert.deepEqual(spotsFor(null, 'body'), []);
  assert.ok(pieces('Hola, ¿puedes regar mis plantas?', []).every((piece) => piece.sign === null || piece.sign === -1));
});

test('found signs are counted once, and the step knows when all are found', () => {
  let mission = newMission();
  assert.equal(firstMissing(mission.found), 0);
  mission = withFound(mission, 0);
  assert.equal(withFound(mission, 0), mission, 'finding the same sign again changes nothing');
  assert.equal(firstMissing(mission.found), 1);
  for (let sign = 1; sign < SIGN_COUNT; sign++) mission = withFound(mission, sign);
  assert.equal(allFound(mission.found), true);
  assert.equal(firstMissing(mission.found), -1);
});
