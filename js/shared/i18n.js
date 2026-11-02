/**
 * Language of the instructions (Spanish or English).
 *
 * The simulated Gmail keeps its English labels (Inbox, Reply, Send…) in both
 * languages on purpose: learners practise the words they will see in the real app.
 * Only explanations, steps, tips and the report change language.
 *
 * Usage: L('Hola', 'Hello') returns the text for the current language.
 * Data that lives longer than one render (catalogs, logs) is stored as
 * {es, en} and resolved with tx() when shown.
 */

/** @typedef {'es'|'en'} Lang */
/** @typedef {{es: string, en: string}} Bilingual */

const STORAGE_KEY = 'practice.lang';

/** @returns {Lang} */
function initialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'es') return fromUrl;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    // No window (unit tests) or storage blocked: fall back to Spanish.
  }
  return 'es';
}

/** @type {Lang} */
let lang = typeof window === 'undefined' ? 'es' : initialLang();

/** @type {Set<(lang: Lang) => void>} */
const listeners = new Set();

export const getLang = () => lang;

/**
 * @param {string} es
 * @param {string} en
 */
export const L = (es, en) => (lang === 'en' ? en : es);

/**
 * Resolves stored bilingual text; plain strings pass through unchanged.
 * @param {string|Bilingual} text
 */
export const tx = (text) => (typeof text === 'string' ? text : L(text.es, text.en));

/**
 * @param {string} es
 * @param {string} en
 * @returns {Bilingual}
 */
export const bi = (es, en) => Object.freeze({ es, en });

/** @param {Lang} next */
export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage may be blocked; the choice still applies for this visit.
  }
  applyLangToDocument();
  listeners.forEach((listener) => listener(next));
}

/** @param {(lang: Lang) => void} listener */
export function onLangChange(listener) {
  listeners.add(listener);
}

export function applyLangToDocument() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
}

/** For unit tests. @param {Lang} next */
export function setLangForTests(next) {
  lang = next;
}
