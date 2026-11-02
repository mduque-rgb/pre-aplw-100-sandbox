import { ALL_STEPS, STEP } from '../mission-steps.js';

/** @returns {import('../types.js').MissionState} */
export function newMission() {
  /** @type {Record<number, import('../types.js').MissionLogEntry>} */
  const log = {};
  for (const step of ALL_STEPS) {
    log[step] = { tries: 0, issues: {}, helps: {}, last: null };
  }
  return {
    step: STEP.READ_NEW,
    read: new Set(),
    deleted: new Set(),
    done: false,
    replay: null,
    log,
  };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @returns {import('../types.js').MissionState}
 */
export function withStep(mission, step) {
  return { ...mission, step };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @returns {import('../types.js').MissionState}
 */
export function withDone(mission) {
  return { ...mission, done: true };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number} id
 * @returns {import('../types.js').MissionState}
 */
export function withRead(mission, id) {
  if (mission.read.has(id)) return mission;
  return { ...mission, read: new Set([...mission.read, id]) };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number[]} ids
 * @returns {import('../types.js').MissionState}
 */
export function withDeleted(mission, ids) {
  const deleted = new Set(mission.deleted);
  ids.forEach((id) => deleted.add(id));
  return deleted.size === mission.deleted.size ? mission : { ...mission, deleted };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number[]} ids
 * @returns {import('../types.js').MissionState}
 */
export function withoutDeleted(mission, ids) {
  const deleted = new Set(mission.deleted);
  ids.forEach((id) => deleted.delete(id));
  return deleted.size === mission.deleted.size ? mission : { ...mission, deleted };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @param {Partial<import('../types.js').MissionLogEntry>|((entry: import('../types.js').MissionLogEntry) => Partial<import('../types.js').MissionLogEntry>)} changes
 * @returns {import('../types.js').MissionState}
 */
export function updateLog(mission, step, changes) {
  const entry = mission.log[step];
  const patch = typeof changes === 'function' ? changes(entry) : changes;
  return {
    ...mission,
    log: { ...mission.log, [step]: { ...entry, ...patch } },
  };
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @returns {import('../types.js').MissionState}
 */
export function withTry(mission, step) {
  return updateLog(mission, step, (entry) => ({ tries: entry.tries + 1 }));
}

/**
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @param {string} text
 * @returns {import('../types.js').MissionState}
 */
export function withIssue(mission, step, text) {
  return updateLog(mission, step, (entry) => ({
    issues: { ...entry.issues, [text]: (entry.issues[text] || 0) + 1 },
  }));
}

/**
 * Logs a hint or help. `text` may be bilingual ({es, en}); the Spanish text is the log key.
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @param {string|{es: string, en: string}} text
 * @param {string} category
 * @returns {import('../types.js').MissionState}
 */
export function withHelp(mission, step, text, category) {
  const key = typeof text === 'string' ? text : text.es;
  return updateLog(mission, step, (entry) => {
    const help = entry.helps[key] || { n: 0, cat: category, text };
    return { helps: { ...entry.helps, [key]: { ...help, n: help.n + 1 } } };
  });
}

/** Steps that can be practised again from the report: the three writing steps. */
/** @type {readonly number[]} */
export const REPLAYABLE_STEPS = Object.freeze([STEP.REPLY_SOFIA, STEP.ASK_DAY_OFF, STEP.SEND_INVOICE]);

/**
 * True when the learner has finished `step` and can practise it again.
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 */
export function canReplay(mission, step) {
  return REPLAYABLE_STEPS.includes(step) && !mission.replay && (mission.done || step < mission.step);
}

/**
 * Sends the learner back to an already finished step, remembering where to return.
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @returns {import('../types.js').MissionState}
 */
export function withReplay(mission, step) {
  if (!canReplay(mission, step)) return mission;
  const replayed = updateLog(mission, step, (entry) => ({ replays: (entry.replays || 0) + 1 }));
  return {
    ...replayed,
    step,
    done: false,
    replay: { step, returnTo: mission.step, wasDone: mission.done },
  };
}

/**
 * Ends an extra practice and puts the learner back where they were.
 * @param {import('../types.js').MissionState} mission
 * @returns {import('../types.js').MissionState}
 */
export function finishReplay(mission) {
  if (!mission.replay) return mission;
  const { returnTo, wasDone } = mission.replay;
  return { ...mission, step: returnTo, done: wasDone, replay: null };
}
