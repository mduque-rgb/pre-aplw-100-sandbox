import { $m } from '../shared/dom.js';

/**
 * nudge.after(ms, condition, target) shows a pulsing red arrow pointing at
 * `target` once `ms` has passed, unless `condition()` returns true by then.
 */
export const nudge = {
  el: null,
  timer: null,

  after(ms, condition, target, dir) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!condition()) this.show(target, dir);
    }, ms);
  },

  show(target, dir) {
    this.clear();
    const targetEl = document.querySelector(target);
    if (!targetEl) return;

    const screen = $m('screen');
    const arrow = document.createElement('div');
    arrow.className = `nudge${dir === 'up' ? ' up' : ''}`;
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg viewBox="0 0 60 60"><path d="M30 56 L8 28 H21 V4 H39 V28 H52 Z" fill="#e8232e" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
    screen.appendChild(arrow);
    this.el = arrow;

    const place = () => {
      const screenRect = screen.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      arrow.style.left = `${targetRect.left - screenRect.left + targetRect.width / 2 - arrow.offsetWidth / 2}px`;
      arrow.style.top = `${dir === 'up'
        ? targetRect.bottom - screenRect.top + 8
        : targetRect.top - screenRect.top - arrow.offsetHeight - 8}px`;
    };

    place();
    this.place = place;
    window.addEventListener('resize', place);
  },

  clear() {
    clearTimeout(this.timer);
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    window.removeEventListener('resize', this.place);
  },
};
