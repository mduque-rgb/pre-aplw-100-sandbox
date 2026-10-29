import { MAIL_ME } from './account.js';
import { CONTACTS } from './contacts.js';
import { sampleMail } from './data/sample-mail.js';
import { newMission } from './domain/mission-state.js';

export const FOLDERS = [
  ['inbox', 'Inbox', 'inbox'],
  ['starred', 'Starred', 'starred'],
  ['sent', 'Sent', 'sent'],
  ['spam', 'Spam', 'spam'],
  ['trash', 'Trash', 'trash'],
];

/** @type {import('./types.js').MailState} */
export const mail = {
  msgs: sampleMail(),
  folder: 'inbox',
  open: null,
  q: '',
  sel: new Set(),
  ask: null,
  undo: null,
  toastTimer: null,
  nextId: 100,
  addr: MAIL_ME,
  mission: newMission(),
  mrQueue: [],
  misreported: new Set(),
  retryDraft: null,
  mr: null,
};

/** @param {number} id */
export const byId = (id) => mail.msgs.find((message) => message.id === id);

/**
 * @param {import('./types.js').MailMessage} message
 * @param {string} folder
 */
export const inFolder = (message, folder) => (
  folder === 'starred'
    ? message.starred && message.folder !== 'trash' && message.folder !== 'spam'
    : message.folder === folder
);

/** @param {import('./types.js').MailMessage} message */
export const shownDate = (message) => (message.date === 'Oct 13' ? message.time : message.date);

/** @param {string} value */
export const avColor = (value) => (
  ['#1f6fe0', '#d93025', '#1a8a3f', '#c77800', '#8e44ad', '#16807a'][(value.charCodeAt(0) || 0) % 6]
);

export function mailVisible() {
  const query = mail.q.trim().toLowerCase();
  return mail.msgs.filter((message) => (
    inFolder(message, mail.folder)
    && (!query
      || `${message.from} ${message.addr} ${message.to} ${message.subject} ${message.body}`
        .toLowerCase()
        .includes(query))
  ));
}

/** @param {import('./types.js').MailMessage} [message] */
export const isSofia = (message) => (
  Boolean(message) && !message.mine && message.addr.toLowerCase() === CONTACTS.sofia.email
);

export const sofiaMsg = () => mail.msgs.find(isSofia);

export const phishMsg = () => mail.msgs.find((message) => message.warn);
