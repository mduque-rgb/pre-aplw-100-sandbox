/**
 * @param {string} selector
 * @param {ParentNode} [root]
 */
export const $ = (selector, root = document) => root.querySelector(selector);

/** @param {string} id */
export const $m = (id) => document.getElementById(id);

/**
 * Escapes text so it can be placed safely inside HTML content or a quoted attribute.
 * @param {unknown} value
 * @returns {string}
 */
export function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}
