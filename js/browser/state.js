/** @returns {HTMLElement} */
const byId = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** @type {import('./types.js').BrowserElements} */
export const browserEls = {
  url: /** @type {HTMLInputElement} */ (byId('b-url')),
  page: byId('b-page'),
  tab: byId('b-tab'),
  back: /** @type {HTMLButtonElement} */ (byId('b-back')),
  fwd: /** @type {HTMLButtonElement} */ (byId('b-fwd')),
};
