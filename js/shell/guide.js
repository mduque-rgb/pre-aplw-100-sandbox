import { $m } from '../shared/dom.js';

export const guide = {
  on: false,
  done: false,

  start() {
    if (this.done) return;
    this.on = true;
    $m('guide').hidden = false;
    this.update('');
  },

  update(key) {
    if (!this.on || this.done) return;
    if (key === 'gmail.com') {
      this.done = true;
      $m('guide').hidden = true;
      $m('guide-strip').hidden = true;
      return;
    }
    $m('guide-strip').hidden = false;
  },
};
