import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMessage,
  moveMessages,
  patchMessage,
  patchMessages,
  removeMessages,
  restoreFolders,
  restoreMessages,
} from '../js/mail/domain/mailbox.js';

const message = (id, folder = 'inbox', extra = {}) => ({
  id,
  from: `Sender ${id}`,
  addr: `sender${id}@example.com`,
  to: 'nicestudent@gmail.com',
  subject: `Subject ${id}`,
  date: 'Oct 13',
  time: '9:00 AM',
  body: `Body ${id}`,
  folder,
  unread: false,
  starred: false,
  ...extra,
});

test('patchMessage changes only the target message without mutating the input', () => {
  const original = [message(1), message(2)];
  const patched = patchMessage(original, 2, { unread: true });

  assert.equal(original[1].unread, false);
  assert.equal(patched[1].unread, true);
  assert.notEqual(patched, original);
  assert.equal(patched[0], original[0]);
});

test('patchMessage accepts a function and keeps other messages untouched', () => {
  const original = [message(1, 'inbox', { starred: false })];
  const patched = patchMessage(original, 1, (entry) => ({ starred: !entry.starred }));

  assert.equal(original[0].starred, false);
  assert.equal(patched[0].starred, true);
});

test('patchMessages updates only selected ids', () => {
  const original = [message(1), message(2), message(3)];
  const patched = patchMessages(original, [1, 3], { unread: true });

  assert.deepEqual(patched.map((entry) => entry.unread), [true, false, true]);
  assert.equal(original.every((entry) => entry.unread === false), true);
});

test('moveMessages records the previous folder without mutating the input', () => {
  const original = [message(1, 'inbox'), message(2, 'inbox')];
  const moved = moveMessages(original, [1], 'trash');

  assert.equal(original[0].folder, 'inbox');
  assert.equal(original[0].prev, undefined);
  assert.equal(moved[0].folder, 'trash');
  assert.equal(moved[0].prev, 'inbox');
  assert.equal(moved[1].folder, 'inbox');
});

test('restoreMessages returns messages to their previous folder', () => {
  const messages = [message(1, 'trash', { prev: 'inbox' }), message(2, 'trash', { mine: true })];
  const restored = restoreMessages(messages, [1, 2]);

  assert.equal(restored[0].folder, 'inbox');
  assert.equal(restored[1].folder, 'sent');
  assert.equal(messages[0].folder, 'trash');
});

test('removeMessages removes selected ids by identity', () => {
  const original = [message(1), message(2), message(3)];
  const remaining = removeMessages(original, [2]);

  assert.deepEqual(remaining.map((entry) => entry.id), [1, 3]);
  assert.equal(original.length, 3);
});

test('addMessage prepends without mutating the input', () => {
  const original = [message(1)];
  const added = addMessage(original, message(2));

  assert.deepEqual(added.map((entry) => entry.id), [2, 1]);
  assert.deepEqual(original.map((entry) => entry.id), [1]);
});

test('restoreFolders restores folder snapshots without reverting other fields', () => {
  const messages = [message(1, 'trash', { unread: true })];
  const restored = restoreFolders(messages, [{ id: 1, folder: 'inbox', prev: undefined }]);

  assert.equal(restored[0].folder, 'inbox');
  assert.equal(restored[0].unread, true);
  assert.equal(messages[0].folder, 'trash');
});
