/**
 * @typedef {import('../types.js').MailMessage} MailMessage
 * @typedef {import('../types.js').FolderId} FolderId
 */

/**
 * @param {MailMessage[]} messages
 * @param {number} id
 * @param {Partial<MailMessage>|((message: MailMessage) => Partial<MailMessage>)} changes
 * @returns {MailMessage[]}
 */
export function patchMessage(messages, id, changes) {
  return messages.map((message) => {
    if (message.id !== id) return message;
    return { ...message, ...(typeof changes === 'function' ? changes(message) : changes) };
  });
}

/**
 * @param {MailMessage[]} messages
 * @param {number[]} ids
 * @param {Partial<MailMessage>|((message: MailMessage) => Partial<MailMessage>)} changes
 * @returns {MailMessage[]}
 */
export function patchMessages(messages, ids, changes) {
  const selected = new Set(ids);
  return messages.map((message) => {
    if (!selected.has(message.id)) return message;
    return { ...message, ...(typeof changes === 'function' ? changes(message) : changes) };
  });
}

/**
 * @param {MailMessage[]} messages
 * @param {number[]} ids
 * @param {FolderId} folder
 * @returns {MailMessage[]}
 */
export function moveMessages(messages, ids, folder) {
  return patchMessages(messages, ids, (message) => ({ folder, prev: message.folder }));
}

/**
 * @param {MailMessage[]} messages
 * @param {number[]} ids
 * @returns {MailMessage[]}
 */
export function restoreMessages(messages, ids) {
  return patchMessages(messages, ids, (message) => ({
    folder: message.prev && message.prev !== 'trash'
      ? message.prev
      : (message.mine ? 'sent' : 'inbox'),
  }));
}

/**
 * @param {MailMessage[]} messages
 * @param {number[]} ids
 * @returns {MailMessage[]}
 */
export function removeMessages(messages, ids) {
  const selected = new Set(ids);
  return messages.filter((message) => !selected.has(message.id));
}

/**
 * @param {MailMessage[]} messages
 * @param {MailMessage} message
 * @returns {MailMessage[]}
 */
export function addMessage(messages, message) {
  return [message, ...messages];
}

/**
 * @param {MailMessage[]} messages
 * @param {{id: number, folder: FolderId, prev: FolderId|undefined}[]} entries
 * @returns {MailMessage[]}
 */
export function restoreFolders(messages, entries) {
  const before = new Map(entries.map((entry) => [entry.id, entry]));
  return messages.map((message) => {
    const entry = before.get(message.id);
    return entry ? { ...message, folder: entry.folder, prev: entry.prev } : message;
  });
}
