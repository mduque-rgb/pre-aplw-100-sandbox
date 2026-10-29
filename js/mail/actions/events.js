import { browser } from '../../browser/browser.js';
import { $m } from '../../shared/dom.js';
import { logHelp, missionRead } from '../domain/mission.js';
import { patchMessage, patchMessages, removeMessages } from '../domain/mailbox.js';
import { byId, isSofia, mail, mailVisible } from '../state.js';
import { drawAtts, togglePicker } from '../ui/attachments.js';
import { fieldOf, hideCoach } from '../ui/coach.js';
import {
  closeCompose,
  composeNew,
  forwardDraft,
  openCompose,
  replyDraft,
  sendMail,
} from '../ui/compose.js';
import { showMisreportAnswer } from '../ui/misreport.js';
import { hideFb } from '../ui/overlay.js';
import { drawMain, drawSide } from '../ui/render.js';
import { composeEl } from '../ui/compose-dom.js';
import { hideToast, mailToast } from '../ui/toast.js';
import {
  goFolder,
  moveMsgs,
  nextReason,
  restoreMsgs,
} from './messages.js';
import { copyReport, downloadReport, showReport } from './report.js';
import { resetPractice } from './reset.js';
import { askSignOut, signOut } from './session.js';

export function mailClick(event) {
  const target = event.target;
  if (target.closest('.m-chk') && !target.matches('input')) return;

  const element = target.closest('[data-act],[data-folder]');
  if (!element) return;

  if (element.dataset.folder) {
    goFolder(element.dataset.folder);
    return;
  }

  const action = element.dataset.act;
  const id = element.dataset.id ? Number(element.dataset.id) : null;
  const ids = () => [...mail.sel];

  switch (action) {
    case 'open': {
      const message = byId(id);
      if (!message) break;
      const wasUnread = message.unread;
      mail.msgs = patchMessage(mail.msgs, id, { unread: false });
      mail.open = id;
      mail.ask = null;
      drawSide();
      drawMain();
      if (wasUnread) missionRead(message);
      break;
    }
    case 'back':
      mail.open = null;
      mail.ask = null;
      drawMain();
      break;
    case 'star':
      mail.msgs = patchMessage(mail.msgs, id, (message) => ({ starred: !message.starred }));
      drawMain();
      break;
    case 'sel': {
      const sel = new Set(mail.sel);
      if (sel.has(id)) sel.delete(id);
      else sel.add(id);
      mail.sel = sel;
      drawMain();
      break;
    }
    case 'selall': {
      const list = mailVisible();
      mail.sel = list.length && list.every((message) => mail.sel.has(message.id))
        ? new Set()
        : new Set(list.map((message) => message.id));
      drawMain();
      break;
    }
    case 'mr-next':
      showMisreportAnswer();
      break;
    case 'mr-spam':
      hideFb();
      goFolder('spam');
      nextReason();
      break;
    case 'mr-close':
      nextReason();
      break;
    case 'bulk-del':
      moveMsgs(ids(), 'trash', 'Moved to Trash');
      break;
    case 'bulk-spam': {
      const spamIds = ids().filter((messageId) => !byId(messageId).mine);
      if (spamIds.length) moveMsgs(spamIds, 'spam', spamIds.length > 1 ? `${spamIds.length} messages reported as spam` : 'Reported as spam. Good job!');
      break;
    }
    case 'bulk-notspam':
      moveMsgs(ids(), 'inbox', 'Moved back to Inbox');
      break;
    case 'row-del':
      moveMsgs([id], 'trash', 'Moved to Trash');
      break;
    case 'row-spam':
      moveMsgs([id], 'spam', 'Reported as spam. Good job!');
      break;
    case 'row-notspam':
      moveMsgs([id], 'inbox', 'Moved back to Inbox');
      break;
    case 'row-restore':
      restoreMsgs([id]);
      break;
    case 'bulk-read':
    case 'bulk-unread':
      mail.msgs = patchMessages(mail.msgs, ids(), { unread: action === 'bulk-unread' });
      mail.sel = new Set();
      drawMain();
      drawSide();
      break;
    case 'bulk-restore':
      restoreMsgs(ids());
      break;
    case 'bulk-forever':
      mail.ask = { kind: 'forever', ids: ids() };
      drawMain();
      break;
    case 'empty-ask':
      mail.ask = { kind: 'empty', ids: mail.msgs.filter((message) => message.folder === 'trash').map((message) => message.id) };
      drawMain();
      break;
    case 'forever-ask':
      mail.ask = { kind: 'forever', ids: [mail.open] };
      drawMain();
      break;
    case 'ask-yes': {
      const gone = new Set(mail.ask.ids);
      mail.msgs = removeMessages(mail.msgs, [...gone]);
      if (gone.has(mail.open)) mail.open = null;
      mail.ask = null;
      mail.sel = new Set();
      drawMain();
      drawSide();
      mailToast('Deleted forever');
      break;
    }
    case 'ask-no':
      mail.ask = null;
      drawMain();
      break;
    case 'del':
      moveMsgs([mail.open], 'trash', 'Moved to Trash');
      break;
    case 'spam':
      moveMsgs([mail.open], 'spam', 'Reported as spam. Good job!');
      break;
    case 'notspam':
      moveMsgs([mail.open], 'inbox', 'Moved back to Inbox');
      break;
    case 'restore':
      restoreMsgs([mail.open]);
      break;
    case 'unread': {
      mail.msgs = patchMessage(mail.msgs, mail.open, { unread: true });
      mail.open = null;
      drawMain();
      drawSide();
      mailToast('Marked as unread');
      break;
    }
    case 'compose':
      composeNew();
      break;
    case 'mission-boss':
    case 'mission-client':
      composeNew();
      break;
    case 'reply': {
      const message = byId(mail.open);
      openCompose({
        ...replyDraft(message),
        mission: mail.mission.step === 4 && !mail.mission.done && isSofia(message) ? 'sofia' : '',
      });
      break;
    }
    case 'forward':
      openCompose(forwardDraft(byId(mail.open)));
      break;
    case 'cx':
      closeCompose();
      mailToast('Message discarded');
      break;
    case 'send':
      sendMail();
      break;
    case 'coach-ok':
      if (element.dataset.k === 'att') togglePicker(true);
      else fieldOf(element.dataset.k).focus();
      break;
    case 'send-anyway-att':
      composeEl().dataset.skipAtt = '1';
      hideCoach('att');
      sendMail();
      break;
    case 'attach':
      togglePicker();
      break;
    case 'pick-cancel':
      togglePicker(false);
      $m('mc-attach').focus();
      break;
    case 'pick': {
      const compose = composeEl();
      const name = element.dataset.f;
      if (!compose._atts.includes(name)) compose._atts = [...compose._atts, name];
      togglePicker(false);
      drawAtts();
      hideCoach('att');
      compose.dataset.skipAtt = '';
      mailToast(`Attached: ${name}`);
      $m('mc-attach').focus();
      break;
    }
    case 'unattach': {
      const compose = composeEl();
      compose._atts = compose._atts.filter((name) => name !== element.dataset.f);
      drawAtts();
      if ($m('mc-picker') && !$m('mc-picker').hidden) togglePicker(true);
      $m('mc-attach').focus();
      break;
    }
    case 'send-anyway-sub':
      composeEl().dataset.skipSub = '1';
      hideCoach('sub');
      sendMail();
      break;
    case 'send-anyway-body':
      composeEl().dataset.skipBody = '1';
      hideCoach('body');
      sendMail();
      break;
    case 'mission-phish': {
      const phish = mail.msgs.find((message) => message.warn);
      if (!phish) break;
      logHelp(3, 'Pediste ver cuál era el correo falso', 'phish');
      mail.msgs = patchMessage(mail.msgs, phish.id, { unread: false });
      mail.open = phish.id;
      mail.ask = null;
      drawSide();
      drawMain();
      break;
    }
    case 'mission-open': {
      const sofia = mail.msgs.find(isSofia);
      if (!sofia) break;
      mail.msgs = patchMessage(mail.msgs, sofia.id, { unread: false });
      mail.open = sofia.id;
      mail.ask = null;
      drawSide();
      drawMain();
      break;
    }
    case 'mission-restart':
      hideFb();
      resetPractice('Práctica reiniciada');
      break;
    case 'report':
      showReport();
      break;
    case 'report-download':
      downloadReport();
      break;
    case 'report-copy':
      copyReport();
      break;
    case 'fb-retry': {
      hideFb();
      const draft = mail.retryDraft || {};
      openCompose({ ...draft, focus: draft.focus || (draft.body ? 'body' : 'to') });
      break;
    }
    case 'fb-next':
      hideFb();
      goFolder('inbox');
      break;
    case 'fb-sent':
      hideFb();
      goFolder('sent');
      break;
    case 'fb-new':
      hideFb();
      composeNew();
      break;
    case 'fb-close':
      hideFb();
      break;
    case 'undo':
      if (mail.undo) {
        const undo = mail.undo;
        mail.undo = null;
        undo();
      }
      hideToast();
      break;
    case 'toast-x':
      hideToast();
      break;
    case 'reset':
      resetPractice('Practice inbox restored');
      break;
    case 'signout':
      askSignOut();
      break;
    case 'so-cancel': {
      hideFb();
      const mission = mail.mission;
      if (mission.step === 7 && !mission.done) {
        logHelp(7, 'Tocaste “Cancel” en la pregunta “¿Seguro que quieres cerrar sesión?”', '');
        mailToast('No pasa nada. Cuando estés listo, toca “Sign out” otra vez.');
      }
      break;
    }
    case 'so-confirm':
      signOut();
      break;
    case 'so-login':
      browser.render('gmail.com');
      break;
  }
}
