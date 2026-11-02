import { $m } from '../../shared/dom.js';
import {
  moveMessages as moveMail,
  restoreFolders,
  restoreMessages as restoreMail,
} from '../domain/mailbox.js';
import { ISSUES } from '../domain/issues.js';
import { updateLog, withDeleted, withHelp, withIssue, withStep, withTry, withoutDeleted } from '../domain/mission-state.js';
import { DELETE_GOAL } from '../mission-goals.js';
import { byId, isSofia, mail, phishMsg } from '../state.js';
import { showMisreport } from '../ui/misreport.js';
import { hideFb } from '../ui/overlay.js';
import { drawMain, drawSide } from '../ui/render.js';
import { mailToast } from '../ui/toast.js';
import { STEP } from '../mission-steps.js';

export function goFolder(folder) {
  mail.folder = folder;
  mail.open = null;
  mail.sel = new Set();
  mail.ask = null;
  mail.q = '';
  /** @type {HTMLInputElement} */ ($m('m-q')).value = '';
  drawSide();
  drawMain();
}

export function nextReason() {
  const [next, ...rest] = mail.mrQueue || [];
  mail.mrQueue = rest;
  if (!next) {
    hideFb();
    return;
  }
  showMisreport(byId(next.id), next.phishDone, next.step);
}

export function moveMsgs(ids, destination, text) {
  const snapshot = ids.map((id) => {
    const message = byId(id);
    return { id, folder: message.folder, prev: message.prev };
  });

  // The step the learner was on when they acted, before this move advances it.
  const stepBefore = mail.mission.step;
  mail.msgs = moveMail(mail.msgs, ids, destination);

  let mission = mail.mission;
  let counted = [];

  if (destination === 'trash' && mission.step === STEP.DELETE_OLD && !mission.done) {
    counted = ids.filter((id) => !mission.deleted.has(id));
    mission = withDeleted(mission, counted);
    if (counted.length) mission = withTry(mission, STEP.DELETE_OLD);
    if (counted.some((id) => isSofia(byId(id)))) {
      mission = withIssue(mission, STEP.DELETE_OLD, ISSUES.DELETED_SOFIA.title);
    }
    if (counted.some((id) => byId(id).warn)) {
      mission = withIssue(mission, STEP.DELETE_OLD, ISSUES.DELETED_PHISH.title);
    }

    if (mission.deleted.size >= DELETE_GOAL) {
      mission = withStep(mission, STEP.REPORT_PHISH);
      text += '. ¡Paso 2 completado!';
      const phish = phishMsg();
      if (phish && phish.folder === 'spam') {
        mission = withStep(mission, STEP.REPLY_SOFIA);
        mission = updateLog(mission, STEP.REPORT_PHISH, { tries: 1, early: true });
        text += ' Ya habías reportado el correo falso, así que el paso 3 también está listo.';
      }
    } else if (counted.length) {
      text += `. Borrados: ${mission.deleted.size} de ${DELETE_GOAL}`;
    }
  }

  let phishDone = false;
  if (destination === 'spam' && mission.step === STEP.REPORT_PHISH && !mission.done) {
    mission = withTry(mission, STEP.REPORT_PHISH);
    if (ids.some((id) => byId(id).warn)) {
      mission = withStep(mission, STEP.REPLY_SOFIA);
      phishDone = true;
    }
  }

  let misreported = mail.misreported || new Set();
  const legitimate = destination === 'spam'
    ? ids.filter((id) => {
      const message = byId(id);
      return !message.warn && !message.mine;
    })
    : [];

  if (legitimate.length) {
    misreported = new Set(misreported);
    legitimate.forEach((id) => misreported.add(id));
    mail.misreported = misreported;
    text = 'Reported as spam';
    if (!mission.done) mission = withIssue(mission, mission.step, ISSUES.REPORTED_REAL_MAIL.title);
  }

  if (destination === 'inbox' && ids.some((id) => misreported.has(id))) {
    misreported = new Set(misreported);
    ids.forEach((id) => misreported.delete(id));
    mail.misreported = misreported;
    text = '¡Bien corregido! El correo volvió a tu bandeja de entrada.';
    if (!mission.done) mission = withHelp(mission, mission.step, 'Corregiste el error con “Not spam”', '');
  }

  mail.mission = mission;
  if (ids.includes(mail.open)) mail.open = null;
  mail.sel = new Set();
  mail.ask = null;
  drawMain();
  drawSide();

  mailToast(text, () => {
    mail.msgs = restoreFolders(mail.msgs, snapshot);
    if (counted.length) {
      mail.mission = withoutDeleted(mail.mission, counted);
      if (mail.mission.step === STEP.DELETE_OLD) {
        mail.mission = withHelp(mail.mission, STEP.DELETE_OLD, 'Usaste “Undo” para recuperar un correo borrado', '');
      }
    }
    if (phishDone && mail.mission.step === STEP.REPLY_SOFIA && !mail.mission.done) mail.mission = withStep(mail.mission, STEP.REPORT_PHISH);
    drawMain();
    drawSide();
  });

  const asked = destination === 'spam'
    ? ids
      .filter((id) => !byId(id).mine)
      .sort((a, b) => (byId(a).warn ? 1 : 0) - (byId(b).warn ? 1 : 0))
    : [];

  if (asked.length) {
    mail.mrQueue = asked.map((id) => ({ id, phishDone: phishDone && Boolean(byId(id).warn), step: stepBefore }));
    nextReason();
  }
}


export function restoreMsgs(ids) {
  if (mail.mission.step === STEP.REPORT_PHISH && !mail.mission.done && ids.some((id) => byId(id).warn)) {
    mail.mission = withHelp(mail.mission, STEP.REPORT_PHISH, 'Restauraste el correo falso desde la Papelera para poder reportarlo', '');
  }

  mail.msgs = restoreMail(mail.msgs, ids);
  if (ids.includes(mail.open)) mail.open = null;
  mail.sel = new Set();
  mail.ask = null;
  drawMain();
  drawSide();
  mailToast('Message restored');
}
