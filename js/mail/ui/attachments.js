import { esc, $m } from '../../shared/dom.js';
import { ic } from '../../shell/icons.js';
import { FILES, extOf, fileOf } from '../data/attachments.js';
import { hideCoach } from './coach.js';
import { composeEl } from './compose-dom.js';

export function attChip(name, removable) {
  const file = fileOf(name);
  const extension = extOf(name);
  return `<span class="att-chip"><span class="att-ic ${extension}" aria-hidden="true">${extension.toUpperCase()}</span><span class="att-name">${esc(name)}<span class="att-size">${esc(file.size)}</span></span>${removable ? `<button class="att-x" type="button" data-act="unattach" data-f="${esc(name)}" aria-label="Remove ${esc(name)}" title="Remove">${ic('x')}</button>` : ''}</span>`;
}

export function drawAtts() {
  const compose = composeEl();
  const box = $m('mc-atts');
  if (box) box.innerHTML = (compose._atts || []).map((name) => attChip(name, true)).join('');
}

export function togglePicker(open) {
  const compose = composeEl();
  const picker = $m('mc-picker');
  const button = $m('mc-attach');
  if (!picker) return;

  const shouldShow = open === undefined ? picker.hidden : open;
  if (!shouldShow) {
    picker.hidden = true;
    picker.innerHTML = '';
    button.setAttribute('aria-expanded', 'false');
    return;
  }

  picker.innerHTML = `<h3>Choose a file to attach</h3><p class="pk-sub">Elige el archivo que quieres adjuntar. Tócalo una vez.</p>
    ${FILES.map((file) => {
      const attached = compose._atts.includes(file.name);
      const extension = extOf(file.name);
      return `<button class="pick-row" type="button" data-act="pick" data-f="${esc(file.name)}"${attached ? ' disabled' : ''}><span class="att-ic ${extension}" aria-hidden="true">${extension.toUpperCase()}</span><span class="att-name">${esc(file.name)}<span class="att-size">${esc(file.size)}${attached ? ' · ya adjuntado' : ''}</span></span></button>`;
    }).join('')}
    <div class="mc-cbtns"><button class="m-link" type="button" data-act="pick-cancel">Cancel</button></div>`;
  picker.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  hideCoach('att');
  /** @type {HTMLElement} */ (picker.querySelector('.pick-row:not(:disabled)') || picker.querySelector('.m-link')).focus();
  picker.scrollIntoView({ block: 'nearest' });
}
