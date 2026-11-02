/**
 * Reading options above the tablet: instructions language, text size and
 * “Listen” (reads the current instruction aloud with the browser's voice).
 */
import { $m } from '../shared/dom.js';
import { getLang, L, onLangChange, setLang } from '../shared/i18n.js';

const ZOOM_KEY = 'practice.zoom';
export const ZOOM_LEVELS = Object.freeze([1, 1.15, 1.3, 1.5]);

function readZoom() {
  try {
    const value = Number(window.localStorage.getItem(ZOOM_KEY));
    return ZOOM_LEVELS.includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

let zoom = readZoom();

function applyZoom() {
  document.documentElement.style.setProperty('--text-scale', String(zoom));
  $m('zoom-level').textContent = `${Math.round(zoom * 100)}%`;
  /** @type {HTMLButtonElement} */ ($m('zoom-out')).disabled = zoom === ZOOM_LEVELS[0];
  /** @type {HTMLButtonElement} */ ($m('zoom-in')).disabled = zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  try {
    window.localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    // Not saved, still applied.
  }
}

/** @param {number} direction  1 = larger, -1 = smaller */
function stepZoom(direction) {
  const index = ZOOM_LEVELS.indexOf(zoom) + direction;
  if (index < 0 || index >= ZOOM_LEVELS.length) return;
  zoom = ZOOM_LEVELS[index];
  applyZoom();
}

function applyLangButtons() {
  document.querySelectorAll('[data-set-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (button).dataset.setLang === getLang()));
  });
  document.querySelectorAll('[data-ph-es]').forEach((input) => {
    const field = /** @type {HTMLInputElement} */ (input);
    field.placeholder = L(field.dataset.phEs || '', field.dataset.phEn || '');
  });
}

/**
 * The instruction the learner is most likely looking at, from the most to the
 * least specific: an open dialog, a writing tip, the step box, the first guide.
 */
const READ_ORDER = [
  '#welcome:not([hidden]) .wl-card',
  '#m-fb:not([hidden]) .m-fb',
  '.m-out-card',
  '.mc-slot:not([hidden]) .mc-coach',
  '#signin-tip:not([hidden])',
  '#m-compose:not([hidden]) .mc-mission',
  '.layer.open .m-mission',
  '.layer.open #guide-strip:not([hidden])',
  '#guide:not([hidden])',
];

function textToRead() {
  for (const selector of READ_ORDER) {
    const element = /** @type {HTMLElement|null} */ (document.querySelector(selector));
    if (element && element.offsetParent !== null) {
      const text = element.innerText.replace(/\s+/g, ' ').trim();
      if (text) return text;
    }
  }
  return L(
    'Toca Browser para abrir el navegador y sigue las instrucciones.',
    'Tap Browser to open the web browser and follow the instructions.',
  );
}

function bindReadAloud() {
  const button = $m('read-aloud');
  const speech = window.speechSynthesis;
  if (!speech || typeof window.SpeechSynthesisUtterance !== 'function') {
    button.hidden = true;
    return;
  }

  const setSpeaking = (on) => button.setAttribute('aria-pressed', String(on));

  button.addEventListener('click', () => {
    if (speech.speaking) {
      speech.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(textToRead());
    utterance.lang = getLang() === 'en' ? 'en-US' : 'es-ES';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speech.speak(utterance);
  });

  onLangChange(() => {
    speech.cancel();
    setSpeaking(false);
  });
}

export function bindReadingTools() {
  document.querySelectorAll('[data-set-lang]').forEach((button) => {
    button.addEventListener('click', () => setLang(/** @type {'es'|'en'} */ (/** @type {HTMLElement} */ (button).dataset.setLang)));
  });
  onLangChange(applyLangButtons);
  applyLangButtons();

  $m('zoom-in').addEventListener('click', () => stepZoom(1));
  $m('zoom-out').addEventListener('click', () => stepZoom(-1));
  applyZoom();

  bindReadAloud();
}

export { textToRead };
