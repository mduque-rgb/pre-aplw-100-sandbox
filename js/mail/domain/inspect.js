/**
 * Step 3 detective game: splits an email into pieces the learner can tap.
 * Pure functions, no DOM, so they are unit-tested.
 */
import { tx } from '../../shared/i18n.js';
import { SIGN_COUNT } from '../data/phishing.js';

/**
 * A piece of an email field.
 * `sign` is the index of the warning sign it shows, -1 for a normal part that can still be tapped,
 * or null for plain text between parts (spaces, line breaks, lone punctuation).
 * @typedef {{text: string, sign: number|null}} Piece
 */

/**
 * The spots of one field of a fake email, in the current language.
 * @param {import('../data/phishing.js').PhishingEmail|null} phish  null for a real email
 * @param {import('../data/phishing.js').SignField} field
 * @returns {{text: string, sign: number}[]}
 */
export function spotsFor(phish, field) {
  if (!phish) return [];
  return phish.signs.flatMap((item, sign) => item.spots
    .filter((place) => place.field === field)
    .map((place) => ({ text: tx(place.text), sign })));
}

/**
 * Splits a normal chunk into one piece per sentence or line, with the spaces between them as plain text.
 * @param {string} chunk
 * @returns {Piece[]}
 */
function phrases(chunk) {
  /** @type {Piece[]} */
  const out = [];
  for (const part of chunk.split(/(\n+|(?<=[.!?:])\s+)/)) {
    if (!part) continue;
    const [, before, middle, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(part);
    if (before) out.push({ text: before, sign: null });
    if (middle) out.push({ text: middle, sign: /[\p{L}\p{N}]/u.test(middle) ? -1 : null });
    if (after) out.push({ text: after, sign: null });
  }
  return out;
}

/**
 * Splits a field into pieces: each spot is one piece, the rest is split into sentences.
 * Joining the pieces' text gives back the field exactly.
 * @param {string} text
 * @param {{text: string, sign: number}[]} spots
 * @returns {Piece[]}
 */
export function pieces(text, spots) {
  /** @type {{start: number, end: number, sign: number}[]} */
  const marks = [];
  for (const { text: wanted, sign } of spots) {
    const start = wanted ? text.indexOf(wanted) : -1;
    const end = start + wanted.length;
    if (start >= 0 && !marks.some((mark) => start < mark.end && end > mark.start)) marks.push({ start, end, sign });
  }
  marks.sort((a, b) => a.start - b.start);

  /** @type {Piece[]} */
  const out = [];
  let position = 0;
  for (const mark of marks) {
    out.push(...phrases(text.slice(position, mark.start)), { text: text.slice(mark.start, mark.end), sign: mark.sign });
    position = mark.end;
  }
  out.push(...phrases(text.slice(position)));
  return out;
}

/**
 * The first sign the learner has not found yet, or -1 when all are found.
 * @param {Set<number>} found
 * @returns {number}
 */
export function firstMissing(found) {
  for (let sign = 0; sign < SIGN_COUNT; sign++) if (!found.has(sign)) return sign;
  return -1;
}

/**
 * @param {Set<number>} found
 * @returns {boolean}
 */
export const allFound = (found) => firstMissing(found) === -1;
