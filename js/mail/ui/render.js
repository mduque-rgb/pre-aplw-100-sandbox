import { browserEls } from '../../browser/state.js';
import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { missionHTML } from '../domain/mission.js';
import {
  avColor,
  byId,
  FOLDERS,
  isSofia,
  mail,
  mailVisible,
  shownDate,
} from '../state.js';
import { attChip } from './attachments.js';

function askHTML() {
  const count = mail.ask.ids.length;
  const question = mail.ask.kind === 'empty'
    ? `Delete all ${count} message${count === 1 ? '' : 's'} in Trash forever?`
    : count === 1
      ? 'Delete this message forever?'
      : `Delete ${count} messages forever?`;

  return `<span class="m-ask">${question}<button class="m-tbtn danger" type="button" data-act="ask-yes">Yes, delete</button><button class="m-tbtn" type="button" data-act="ask-no">Cancel</button></span>`;
}

function emptyText() {
  if (mail.q.trim()) return `No messages match “${esc(mail.q.trim())}”.`;
  return {
    inbox: 'Your inbox is empty. Tap “Reset practice inbox” to bring the sample emails back.',
    starred: 'No starred messages. Tap the star next to a message to add it here.',
    sent: 'You have not sent anything yet. Tap Compose to write a message.',
    spam: 'No spam here.',
    trash: 'Trash is empty.',
  }[mail.folder];
}

function quickHTML(message) {
  const button = (action, icon, label, className = '') => `<button class="m-qbtn${className}" type="button" data-act="${action}" data-id="${message.id}" aria-label="${label}: ${esc(message.subject)}" title="${label}">${ic(icon)}<span>${label}</span></button>`;

  let html = '';
  if (message.folder === 'trash') html = button('row-restore', 'restore', 'Restore');
  else if (message.folder === 'spam') html = button('row-notspam', 'inbox', 'Not spam') + button('row-del', 'trash', 'Delete', ' danger');
  else html = button('row-del', 'trash', 'Delete', ' danger') + (message.mine ? '' : button('row-spam', 'spam', 'Report spam', ' warn'));
  return `<span class="m-quick">${html}</span>`;
}

function rowHTML(message) {
  const selected = mail.sel.has(message.id);
  const who = message.mine ? `To: ${message.to}` : message.from;
  const snippet = message.body.replace(/\s+/g, ' ').slice(0, 80);

  return `<div class="m-row${message.unread ? ' unread' : ''}${selected ? ' sel' : ''}" role="listitem" tabindex="0" data-act="open" data-id="${message.id}">
    <label class="m-chk"><input type="checkbox" data-act="sel" data-id="${message.id}" aria-label="Select message: ${esc(message.subject)}"${selected ? ' checked' : ''}></label>
    <button class="m-star${message.starred ? ' on' : ''}" type="button" data-act="star" data-id="${message.id}" aria-label="${message.starred ? 'Remove star' : 'Add star'}" title="Star">${ic('starred')}</button>
    <span class="m-from">${esc(who)}</span>
    <span class="m-subj"><b>${esc(message.subject)}</b><span class="m-snip"> – ${esc(snippet)}</span></span>
    ${message.atts && message.atts.length ? `<span title="Has attachment">${ic('clip', 'm-clip')}</span>` : ''}
    ${quickHTML(message)}
    <span class="m-date">${esc(shownDate(message))}</span></div>`;
}

function listHTML() {
  const list = mailVisible();
  const title = FOLDERS.find(([folder]) => folder === mail.folder)[1];
  const selected = list.filter((message) => mail.sel.has(message.id)).length;
  const all = list.length > 0 && selected === list.length;

  let tools = `<label class="m-chk" title="Select all"><input type="checkbox" data-act="selall" aria-label="Select all"${all ? ' checked' : ''}></label>`;

  if (mail.ask) {
    tools += askHTML();
  } else if (selected) {
    tools += `<span class="m-count">${selected} selected</span>`;
    tools += mail.folder === 'trash'
      ? `<button class="m-tbtn" type="button" data-act="bulk-restore">${ic('restore')}Restore</button><button class="m-tbtn danger" type="button" data-act="bulk-forever">${ic('trash')}Delete forever</button>`
      : `<button class="m-tbtn danger" type="button" data-act="bulk-del">${ic('trash')}Delete</button>${mail.folder === 'spam' ? `<button class="m-tbtn" type="button" data-act="bulk-notspam">${ic('inbox')}Not spam</button>` : `<button class="m-tbtn" type="button" data-act="bulk-spam">${ic('spam')}Report spam</button>`}<button class="m-tbtn" type="button" data-act="bulk-read">${ic('mail')}Mark as read</button><button class="m-tbtn" type="button" data-act="bulk-unread">${ic('mail')}Mark as unread</button>`;
  } else {
    tools += `<h2 class="m-title">${title}</h2>`;
    if (mail.q.trim()) tools += `<span class="m-count">Results for “${esc(mail.q.trim())}”</span>`;
    if (mail.folder === 'trash' && list.length) tools += '<button class="m-tbtn danger" type="button" data-act="empty-ask">Empty Trash now</button>';
  }

  const rows = list.length ? list.map(rowHTML).join('') : `<div class="m-empty">${emptyText()}</div>`;
  const mission = mail.folder === 'inbox' && !mail.q.trim() && !selected && !mail.ask ? missionHTML() : '';
  return `<div class="m-tools">${tools}</div>${mission}<div class="m-list" role="list">${rows}</div>`;
}

function readHTML(message) {
  let tools = `<button class="m-tbtn" type="button" data-act="back">${ic('back')}Back</button><span class="m-sp"></span>`;

  if (mail.ask) {
    tools += askHTML();
  } else if (message.folder === 'trash') {
    tools += `<button class="m-tbtn" type="button" data-act="restore">${ic('restore')}Restore</button><button class="m-tbtn danger" type="button" data-act="forever-ask">${ic('trash')}Delete forever</button>`;
  } else {
    tools += `<button class="m-tbtn danger" type="button" data-act="del">${ic('trash')}Delete</button>`;
    if (message.folder === 'spam') tools += `<button class="m-tbtn" type="button" data-act="notspam">${ic('inbox')}Not spam</button>`;
    else if (!message.mine) tools += `<button class="m-tbtn" type="button" data-act="spam">${ic('spam')}Report spam</button>`;
    if (!message.mine) tools += `<button class="m-tbtn" type="button" data-act="unread">${ic('mail')}Mark as unread</button>`;
    tools += `<button class="m-tbtn" type="button" data-act="star" data-id="${message.id}">${ic('starred', `st${message.starred ? ' on' : ''}`)}${message.starred ? 'Starred' : 'Star'}</button>`;
  }

  const phishStep = mail.mission.step === 3 && !mail.mission.done && message.warn;
  const safety = (phishStep && message.folder === 'trash')
    ? '<div class="m-mission"><p><b>Paso 3 de 7:</b> este correo falso está en la Papelera. Toca <b>Restore</b> (Restaurar) arriba y luego, desde tu bandeja, ábrelo otra vez y toca <b>Report spam</b>.</p></div>'
    : (phishStep && message.folder !== 'spam')
      ? '<div class="m-mission"><p><b>Paso 3 de 7: ¡Este correo es falso!</b> Fíjate en las señales: un remitente que no conoces, un premio que no pediste, mucha prisa (“24 hours”) y te pide tu contraseña. <b>No respondas.</b> Toca <b>Report spam</b> (Reportar spam) arriba.</p></div>'
      : message.warn
        ? '<div class="m-safety"><p><b>Practice tip:</b> this message looks like spam. Real companies never ask for your password by email. Tap “Report spam” to move it out of your inbox.</p><p><b>Consejo:</b> este mensaje parece spam. Ninguna empresa real te pide tu contraseña por correo. Toca “Report spam”.</p></div>'
        : '';

  return `<div class="m-tools">${tools}</div>
  <article class="m-msg">
    ${mail.mission.step === 2 && !mail.mission.done && !message.mine && !isSofia(message) && message.folder !== 'trash' ? '<div class="m-mission"><p><b>Paso 2 de 7:</b> si ya no necesitas este correo, toca <b>Delete</b> (Borrar) arriba.</p></div>' : ''}
    <h2 class="m-subject">${esc(message.subject)}</h2>
    <div class="m-meta"><span class="m-av2" style="background:${avColor(message.mine ? 'N' : message.from)}">${esc((message.mine ? 'N' : message.from).charAt(0).toUpperCase())}</span>
      <div><div><b>${esc(message.mine ? 'Me' : message.from)}</b> <span class="m-muted">&lt;${esc(message.addr)}&gt;</span></div>
      <div class="m-muted">to ${esc(message.mine ? message.to : 'me')} · ${esc(message.date)}, ${esc(message.time)}</div></div></div>
    ${safety}
    <div class="m-text">${esc(message.body)}</div>
    ${message.atts && message.atts.length ? `<div class="m-atts" aria-label="Attachments">${message.atts.map((name) => attChip(name, false)).join('')}</div>` : ''}
    ${mail.mission.step === 4 && !mail.mission.done && isSofia(message) ? '<div class="m-mission"><p><b>Paso 4 de 7:</b> toca <b>Reply</b> (Responder), aquí abajo, para contestarle a Sofía.</p></div>' : ''}
    <div class="m-actions"><button class="m-big primary" type="button" data-act="reply">${ic('reply')}Reply</button><button class="m-big" type="button" data-act="forward">${ic('forward')}Forward</button></div>
  </article>`;
}

export function drawSide() {
  const unread = (folder) => mail.msgs.filter((message) => message.folder === folder && message.unread).length;
  $m('m-side').innerHTML = `<button class="m-compose-btn" type="button" data-act="compose" title="Compose">${ic('pencil')}<span class="lbl">Compose</span></button>${FOLDERS.map(([folder, label, icon]) => {
    const count = (folder === 'inbox' || folder === 'spam') ? unread(folder) : 0;
    return `<button class="m-nav${mail.folder === folder ? ' on' : ''}" type="button" data-folder="${folder}" title="${label}">${ic(icon)}<span class="lbl">${label}</span>${count ? `<span class="badge" aria-label="${count} unread">${count}</span>` : ''}</button>`;
  }).join('')}<button class="m-nav m-reset" type="button" data-act="reset" title="Reset practice inbox">${ic('restore')}<span class="lbl">Reset practice inbox</span></button>`;

  const inboxUnread = unread('inbox');
  browserEls.tab.textContent = inboxUnread ? `Inbox (${inboxUnread})` : 'Inbox';
}

export function drawMain() {
  const message = mail.open ? byId(mail.open) : null;
  $m('m-body').innerHTML = message ? readHTML(message) : listHTML();
}

