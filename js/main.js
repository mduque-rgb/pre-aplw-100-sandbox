import { bindBrowserChrome, browser } from './browser/browser.js';
import { learner } from './learner/state.js';
import { refreshReport } from './mail/actions/report.js';
import { logHelp } from './mail/domain/mission.js';
import { newMission } from './mail/domain/mission-state.js';
import { STEP } from './mail/mission-steps.js';
import { mountMail } from './mail/mount.js';
import { bindAutosave, clearProgress, loadProgress, restoreProgress, saveProgress, saveSoon } from './mail/persist.js';
import { freshInbox, mail } from './mail/state.js';
import { refreshComposeMission } from './mail/ui/compose.js';
import { drawMain, drawSide } from './mail/ui/render.js';
import { $m } from './shared/dom.js';
import { applyLangToDocument, onLangChange } from './shared/i18n.js';
import { startClock } from './shell/clock.js';
import { bindHome, buildHome, goHome } from './shell/home.js';
import { bindReadingTools } from './shell/reading-tools.js';
import { bindWelcome } from './shell/welcome.js';

applyLangToDocument();

browser.onAuthenticated = (page, address) => mountMail(page, address);
buildHome();
bindHome();
bindBrowserChrome();
startClock();
bindReadingTools();
bindAutosave();

const saved = loadProgress();
bindWelcome({
  resume: saved && {
    name: saved.learner.first,
    step: saved.mission.step,
    done: saved.mission.done,
  },
  onContinue: () => {
    if (saved) restoreProgress(saved);
  },
  onRestart: () => {
    clearProgress();
    learner.first = '';
    learner.last = '';
  },
  onStart: () => {
    mail.mission = newMission();
    mail.msgs = freshInbox();
    saveProgress();
  },
});

// Instructions change language in place; the open inbox, report and compose box are redrawn.
onLangChange(() => {
  if (!$m('mail-app')) return;
  drawSide();
  drawMain();
  refreshComposeMission();
  refreshReport();
});

const signOutWasMissed = () => (
  mail.mission.step === STEP.SIGN_OUT
  && !mail.mission.done
  && $m('mail-app')
  && !$m('m-out')
);

$m('b-close').addEventListener('click', () => {
  if (signOutWasMissed()) {
    logHelp(STEP.SIGN_OUT, { es: 'Cerraste el navegador sin cerrar sesión', en: 'You closed the browser without signing out' }, 'logout');
    saveSoon();
  }
  goHome();
  browser.reset();
});

$m('b-min').addEventListener('click', () => goHome());

$m('b-tabclose').addEventListener('click', () => {
  if (signOutWasMissed()) {
    logHelp(STEP.SIGN_OUT, { es: 'Cerraste la pestaña sin cerrar sesión', en: 'You closed the tab without signing out' }, 'logout');
    saveSoon();
  }
  browser.reset();
  browser.go('start');
});
