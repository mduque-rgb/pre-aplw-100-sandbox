/** @returns {import('../types.js').MissionState} */
export function newMission() {
  /** @type {Record<number, import('../types.js').MissionLogEntry>} */
  const log = {};
  for (let step = 1; step <= 7; step++) {
    log[step] = { tries: 0, issues: {}, helps: {}, last: null };
  }
  return {
    step: 1,
    read: new Set(),
    deleted: new Set(),
    done: false,
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
 * @param {import('../types.js').MissionState} mission
 * @param {number} step
 * @param {string} text
 * @param {string} category
 * @returns {import('../types.js').MissionState}
 */
export function withHelp(mission, step, text, category) {
  return updateLog(mission, step, (entry) => {
    const help = entry.helps[text] || { n: 0, cat: category };
    return { helps: { ...entry.helps, [text]: { ...help, n: help.n + 1 } } };
  });
}
