/**
 * Keeps the practice across page reloads, only in this browser (localStorage).
 * Nothing is sent anywhere. Saved progress expires after a few hours because
 * the practice is often done on shared devices, such as library tablets.
 */
import { learner } from '../learner/state.js';
import { localizeMessages } from './data/sample-mail.js';
import { mail } from './state.js';

const KEY = 'practice.progress.v1';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

/**
 * @typedef {Object} SavedProgress
 * @property {number} savedAt
 * @property {{first: string, last: string}} learner
 * @property {import('./types.js').MailMessage[]} msgs
 * @property {number} nextId
 * @property {number[]} misreported
 * @property {Omit<import('./types.js').MissionState, 'read'|'deleted'> & {read: number[], deleted: number[]}} mission
 */

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** @returns {SavedProgress} */
export function snapshot() {
  const { mission } = mail;
  return {
    savedAt: Date.now(),
    learner: { first: learner.first, last: learner.last },
    msgs: mail.msgs,
    nextId: mail.nextId,
    misreported: [...(mail.misreported || [])],
    mission: { ...mission, read: [...mission.read], deleted: [...mission.deleted] },
  };
}

export function saveProgress() {
  if (!learner.first) return;
  try {
    storage()?.setItem(KEY, JSON.stringify(snapshot()));
  } catch {
    // Storage full or blocked: the practice keeps working without saving.
  }
}

let timer = 0;
/** Saves shortly after a burst of activity. */
export function saveSoon() {
  clearTimeout(timer);
  timer = window.setTimeout(saveProgress, 300);
}

/** @returns {SavedProgress|null} */
export function loadProgress() {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const saved = /** @type {SavedProgress} */ (JSON.parse(raw));
    if (!saved || !saved.learner?.first || !Array.isArray(saved.msgs) || !saved.mission?.log) return null;
    if (Date.now() - saved.savedAt > MAX_AGE_MS) {
      clearProgress();
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

/** @param {SavedProgress} saved */
export function restoreProgress(saved) {
  learner.first = saved.learner.first;
  learner.last = saved.learner.last;
  // Saved in one language, shown in the one chosen now.
  mail.msgs = localizeMessages(saved.msgs);
  mail.nextId = saved.nextId;
  mail.misreported = new Set(saved.misreported);
  mail.mission = {
    ...saved.mission,
    read: new Set(saved.mission.read),
    deleted: new Set(saved.mission.deleted),
  };
}

export function clearProgress() {
  clearTimeout(timer);
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Save on every interaction inside the inbox and when the page is hidden or closed. */
export function bindAutosave() {
  window.addEventListener('pagehide', saveProgress);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveProgress();
  });
}
