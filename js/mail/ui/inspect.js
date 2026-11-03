/**
 * Step 3 detective game: the HTML of an email being inspected.
 * Every part of the email can be tapped, in real and fake emails alike,
 * so opening an email does not give away which one is fake.
 */
import { esc } from '../../shared/dom.js';
import { L } from '../../shared/i18n.js';
import { SIGN_COUNT, phishingById } from '../data/phishing.js';
import { allFound, pieces, spotsFor } from '../domain/inspect.js';
import { STEP } from '../mission-steps.js';
import { mail } from '../state.js';

/**
 * True while the learner is on step 3 and this email can be inspected.
 * @param {import('../types.js').MailMessage} message
 */
export const isInspecting = (message) => (
  mail.mission.step === STEP.REPORT_PHISH && !mail.mission.done && !message.mine && message.folder !== 'trash'
);

/** @param {import('../types.js').MailMessage} message */
export const phishOf = (message) => (message.warn ? phishingById(message.phishId) : null);

/**
 * One field of the email (sender address, subject or body) as tappable pieces.
 * @param {import('../types.js').MailMessage} message
 * @param {import('../data/phishing.js').SignField} field
 * @param {string} text
 */
export function fieldHTML(message, field, text) {
  const phish = phishOf(message);
  return pieces(text, spotsFor(phish, field)).map((piece, index) => {
    if (piece.sign === null) return esc(piece.text);
    const found = phish && piece.sign >= 0 && mail.mission.found.has(piece.sign);
    return `<span class="ph-seg${found ? ' found' : ''}" role="button" tabindex="0" data-act="ph-tap" data-sign="${piece.sign}" data-piece="${field}-${index}"${found ? ` aria-label="${esc(`${piece.text} (${L('señal encontrada', 'sign found')})`)}"` : ''}>${esc(piece.text)}</span>`;
  }).join('');
}

/**
 * The detective box above an email being inspected.
 * @param {import('../types.js').MailMessage} message
 */
export function panelHTML(message) {
  const phish = phishOf(message);
  const found = mail.mission.found;
  const note = mail.inspect && mail.inspect.id === message.id ? mail.inspect.note : '';
  const done = phish && allFound(found);
  // The found parts are already green in the email, so the box only counts them.
  const count = phish && found.size
    ? `<span class="m-prog">${L('Encontraste', 'You found')} ${found.size} ${L('de', 'of')} ${SIGN_COUNT}</span>`
    : '';
  const hint = done ? '' : `<button class="m-tbtn" type="button" data-act="ph-hint">${L('Dame una pista', 'Give me a hint')}</button>`;
  const next = done && message.folder !== 'spam'
    ? `<p class="ph-next">${L('¡Encontraste todas las señales! Ahora toca <b>Report spam</b> arriba para sacarlo de tu bandeja.', 'You found every sign! Now tap <b>Report spam</b> above to move it out of your inbox.')}</p>`
    : '';

  return `<div class="m-detective" role="group" aria-labelledby="ph-h">
    <div class="ph-head"><p id="ph-h">${L(
    '<b>🔍 Paso 3 de 7: Sé detective.</b> Toca lo que te parezca sospechoso: quién lo envía, el asunto o el texto. <b>No lo respondas.</b>',
    '<b>🔍 Step 3 of 7: Be a detective.</b> Tap anything that looks suspicious: who sent it, the subject or the text. <b>Don’t reply.</b>',
  )}</p>${count}${hint}</div>
    <p class="ph-note">${note}</p>
    ${next}
  </div>`;
}
