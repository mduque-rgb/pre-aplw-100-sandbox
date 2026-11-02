import assert from 'node:assert/strict';
import test from 'node:test';
import {
  newMission,
  updateLog,
  withDeleted,
  withDone,
  withHelp,
  withIssue,
  withReplay,
  finishReplay,
  canReplay,
  withRead,
  withStep,
  withTry,
  withoutDeleted,
} from '../js/mail/domain/mission-state.js';

test('newMission creates independent logs for every step', () => {
  const mission = newMission();
  mission.log[1].issues.foo = 1;

  assert.equal(mission.log[1].issues.foo, 1);
  assert.deepEqual(mission.log[2].issues, {});
  assert.equal(mission.step, 1);
  assert.equal(mission.read.size, 0);
  assert.equal(mission.deleted.size, 0);
  assert.equal(mission.done, false);
});

test('withStep and withDone return new mission objects', () => {
  const mission = newMission();
  const advanced = withDone(withStep(mission, 3));

  assert.equal(mission.step, 1);
  assert.equal(mission.done, false);
  assert.equal(advanced.step, 3);
  assert.equal(advanced.done, true);
});

test('withRead adds a new Set and avoids duplicates', () => {
  const mission = newMission();
  const read = withRead(mission, 7);
  const duplicate = withRead(read, 7);

  assert.equal(mission.read.size, 0);
  assert.deepEqual([...read.read], [7]);
  assert.equal(duplicate, read);
});

test('withDeleted and withoutDeleted update only the deleted set', () => {
  const mission = newMission();
  const deleted = withDeleted(mission, [1, 2, 2]);
  const restored = withoutDeleted(deleted, [2]);

  assert.equal(mission.deleted.size, 0);
  assert.deepEqual([...deleted.deleted].sort(), [1, 2]);
  assert.deepEqual([...restored.deleted], [1]);
  assert.notEqual(restored, deleted);
});

test('updateLog clones only the target log entry', () => {
  const mission = newMission();
  const updated = updateLog(mission, 2, { last: ['Revisar asunto'] });

  assert.equal(mission.log[2].last, null);
  assert.deepEqual(updated.log[2].last, ['Revisar asunto']);
  assert.equal(updated.log[1], mission.log[1]);
  assert.notEqual(updated.log, mission.log);
});

test('withTry, withIssue and withHelp build on previous entries', () => {
  const mission = withHelp(withIssue(withTry(newMission(), 3), 3, 'Falta el asunto'), 3, 'Pediste ayuda', 'subject');

  assert.equal(mission.log[3].tries, 1);
  assert.equal(mission.log[3].issues['Falta el asunto'], 1);
  assert.deepEqual(mission.log[3].helps['Pediste ayuda'], { n: 1, cat: 'subject', text: 'Pediste ayuda' });
});

test('withHelp keeps bilingual text and uses the Spanish text as key', () => {
  const mission = withHelp(newMission(), 2, { es: 'Usaste Undo', en: 'You used Undo' }, '');
  assert.deepEqual(mission.log[2].helps['Usaste Undo'].text, { es: 'Usaste Undo', en: 'You used Undo' });
});

test('a finished writing step can be practised again and then returns to where it was', () => {
  const finished = withDone(withStep(newMission(), 7));
  assert.equal(canReplay(finished, 5), true);
  assert.equal(canReplay(finished, 2), false, 'inbox steps are not replayable');

  const replay = withReplay(finished, 5);
  assert.equal(replay.step, 5);
  assert.equal(replay.done, false);
  assert.equal(replay.log[5].replays, 1);
  assert.equal(canReplay(replay, 4), false, 'only one extra practice at a time');

  const back = finishReplay(replay);
  assert.equal(back.step, 7);
  assert.equal(back.done, true);
  assert.equal(back.replay, null);
});

test('a step that is not finished yet cannot be replayed', () => {
  const mission = withStep(newMission(), 5);
  assert.equal(canReplay(mission, 5), false);
  assert.equal(canReplay(mission, 6), false);
  assert.equal(canReplay(mission, 4), true);
  assert.equal(withReplay(mission, 6), mission);
});
