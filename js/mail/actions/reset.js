import { $m } from '../../shared/dom.js';
import { sampleMail } from '../data/sample-mail.js';
import { newMission } from '../domain/mission-state.js';
import { mail } from '../state.js';
import { closeCompose } from '../ui/compose.js';
import { drawMain, drawSide } from '../ui/render.js';
import { mailToast } from '../ui/toast.js';

export function resetPractice(message) {
  mail.mission = newMission();
  mail.msgs = sampleMail();
  mail.folder = 'inbox';
  mail.open = null;
  mail.sel = new Set();
  mail.ask = null;
  mail.q = '';
  /** @type {HTMLInputElement} */ ($m('m-q')).value = '';
  closeCompose();
  drawSide();
  drawMain();
  mailToast(message);
}
