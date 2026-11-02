import assert from 'node:assert/strict';
import test from 'node:test';

import { analyze } from '../js/mail/domain/analysis.js';
import { CATEGORIES, ISSUES, categoryOf } from '../js/mail/domain/issues.js';

const HELP_CATEGORIES = ['tools', 'address', 'phish', 'logout'];

test('every issue belongs to a category the report can show', () => {
  for (const [key, { category }] of Object.entries(ISSUES)) {
    assert.ok(CATEGORIES[category], `${key} uses unknown category “${category}”`);
  }
});

test('categories used by help entries exist', () => {
  for (const category of HELP_CATEGORIES) assert.ok(CATEGORIES[category], category);
});

test('issue titles are unique, so the log never mixes two problems', () => {
  const titles = Object.values(ISSUES).map(({ title }) => title);
  assert.equal(new Set(titles).size, titles.length);
});

test('categoryOf finds known titles and ignores unknown ones', () => {
  assert.equal(categoryOf(ISSUES.NO_GREETING.title), 'greet');
  assert.equal(categoryOf('Not a real issue'), undefined);
});

const message = (overrides) => ({ subject: 'Hello', to: 'a@b.com', atts: [], ...overrides });

const SAMPLES = [
  [message({ subject: '(no subject)' }), 'new', '', ''],
  [message({ subject: 'HELLO THERE FRIEND' }), 'new', 'hey', 'boss'],
  [message({ subject: 'x'.repeat(70) }), 'new', 'hey', 'client'],
  [message({ subject: 'Hola' }), 'new', 'que tal\n\nBesos', 'boss'],
  [message({ subject: 'Hola' }), 'new', 'hola', 'client'],
  [message({ atts: ['Factura_1044_Gomez.pdf'] }), 'new', 'factura', 'client'],
  [message({ atts: ['Foto_vacaciones.jpg'] }), 'new', 'invoice', 'client'],
  [message({ atts: ['Factura_1045_Rivera.pdf', 'Lista_compras.txt'] }), 'new', 'hi', 'client'],
  [message(), 'reply', 'ok', 'sofia'],
  [message(), 'reply', 'nada', 'sofia'],
  [message(), 'new', 'holaquetal estoyaqui y pero y que y entonces y porque y que y pero y entonces y que y pero y porque y que y fin de la frase larga sin parar nunca jamas', ''],
];

test('every warning produced by the analysis is in the catalog', () => {
  const seen = new Set();
  for (const sample of SAMPLES) {
    for (const item of analyze(...sample).items) {
      if (item.ok && !item.tip) continue;
      seen.add(item.t);
      assert.ok(categoryOf(item.t), `“${item.t}” is missing from ISSUES`);
    }
  }
  assert.ok(seen.size >= 15, `only ${seen.size} warnings exercised`);
});
