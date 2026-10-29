import { $m } from '../../shared/dom.js';
import {
  moveMessages as moveMail,
  restoreFolders,
  restoreMessages as restoreMail,
} from '../domain/mailbox.js';
import { updateLog, withDeleted, withHelp, withIssue, withStep, withTry, withoutDeleted } from '../domain/mission-state.js';
import { DELETE_GOAL } from '../mission-goals.js';
import { byId, isSofia, mail, phishMsg } from '../state.js';
import { showMisreport } from '../ui/misreport.js';
import { hideFb } from '../ui/overlay.js';
import { drawMain, drawSide } from '../ui/render.js';
import { mailToast } from '../ui/toast.js';

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
  showMisreport(byId(next.id), next.phishDone);
}

export function moveMsgs(ids, destination, text) {
  const snapshot = ids.map((id) => {
    const message = byId(id);
    return { id, folder: message.folder, prev: message.prev };
  });

  mail.msgs = moveMail(mail.msgs, ids, destination);

  let mission = mail.mission;
  let counted = [];

  if (destination === 'trash' && mission.step === 2 && !mission.done) {
    counted = ids.filter((id) => !mission.deleted.has(id));
    mission = withDeleted(mission, counted);
    if (counted.length) mission = withTry(mission, 2);
    if (counted.some((id) => isSofia(byId(id)))) {
      mission = withIssue(mission, 2, 'Borraste el correo de Sofía, que necesitabas después');
    }
    if (counted.some((id) => byId(id).warn)) {
      mission = withIssue(mission, 2, 'Borraste el correo falso en lugar de reportarlo como spam');
    }

    if (mission.deleted.size >= DELETE_GOAL) {
      mission = withStep(mission, 3);
      text += '. ¡Paso 2 completado!';
      const phish = phishMsg();
      if (phish && phish.folder === 'spam') {
        mission = withStep(mission, 4);
        mission = updateLog(mission, 3, { tries: 1, early: true });
        text += ' Ya habías reportado el correo falso, así que el paso 3 también está listo.';
      }
    } else if (counted.length) {
      text += `. Borrados: ${mission.deleted.size} de ${DELETE_GOAL}`;
    }
  }

  let phishDone = false;
  if (destination === 'spam' && mission.step === 3 && !mission.done) {
    mission = withTry(mission, 3);
    if (ids.some((id) => byId(id).warn)) {
      mission = withStep(mission, 4);
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
    if (!mission.done) mission = withIssue(mission, mission.step, 'Reportaste como spam un correo real');
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
      if (mail.mission.step === 2) {
        mail.mission = withHelp(mail.mission, 2, 'Usaste “Undo” para recuperar un correo borrado', '');
      }
    }
    if (phishDone && mail.mission.step === 4 && !mail.mission.done) mail.mission = withStep(mail.mission, 3);
    drawMain();
    drawSide();
  });

  const asked = destination === 'spam'
    ? ids
      .filter((id) => !byId(id).mine)
      .sort((a, b) => (byId(a).warn ? 1 : 0) - (byId(b).warn ? 1 : 0))
    : [];

  if (asked.length) {
    mail.mrQueue = asked.map((id) => ({ id, phishDone: phishDone && Boolean(byId(id).warn) }));
    nextReason();
  }
}


export function restoreMsgs(ids) {
  if (mail.mission.step === 3 && !mail.mission.done && ids.some((id) => byId(id).warn)) {
    mail.mission = withHelp(mail.mission, 3, 'Restauraste el correo falso desde la Papelera para poder reportarlo', '');
  }

  mail.msgs = restoreMail(mail.msgs, ids);
  if (ids.includes(mail.open)) mail.open = null;
  mail.sel = new Set();
  mail.ask = null;
  drawMain();
  drawSide();
  mailToast('Message restored');
}
