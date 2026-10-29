import { bindBrowserChrome, browser } from './browser/browser.js';
import { logHelp } from './mail/domain/mission.js';
import { mountMail } from './mail/mount.js';
import { mail } from './mail/state.js';
import { $m } from './shared/dom.js';
import { startClock } from './shell/clock.js';
import { bindHome, buildHome, goHome } from './shell/home.js';
import { bindWelcome } from './shell/welcome.js';

browser.onAuthenticated = (page, address) => mountMail(page, address);
buildHome();
bindHome();
bindBrowserChrome();
startClock();
bindWelcome();

const signOutWasMissed = () => (
  mail.mission.step === 7
  && !mail.mission.done
  && $m('mail-app')
  && !$m('m-out')
);

$m('b-close').addEventListener('click', () => {
  if (signOutWasMissed()) logHelp(7, 'Cerraste el navegador sin cerrar sesión', 'logout');
  goHome();
  browser.reset();
});

$m('b-min').addEventListener('click', () => goHome());

$m('b-tabclose').addEventListener('click', () => {
  if (signOutWasMissed()) logHelp(7, 'Cerraste la pestaña sin cerrar sesión', 'logout');
  browser.reset();
  browser.go('start');
});
