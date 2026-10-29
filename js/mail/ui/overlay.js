import { $m } from '../../shared/dom.js';

export function hideFb() {
  const overlay = $m('m-fb');
  if (!overlay) return;
  overlay.hidden = true;
  overlay.innerHTML = '';
}
