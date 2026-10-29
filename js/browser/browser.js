import { bindSignin } from '../auth/signin.js';
import { esc } from '../shared/dom.js';
import { guide } from '../shell/guide.js';
import { nudge } from '../shell/nudge.js';
import { browserEls } from './state.js';
import { searchResults, sites } from './sites.js';

export const browser = {
  history: [],
  index: -1,
  loaded: false,
  barUsed: false,
  /** @type {((page: HTMLElement, address: string) => void)|null} */
  onAuthenticated: null,
  el: browserEls,

  normalize(input) {
    let value = input.trim();
    if (!value) return 'start';
    value = value
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
    if (value === 'mail.google.com') value = 'gmail.com';
    if (sites[value]) return value;
    if (/^[a-z0-9-]+\.[a-z]{2,}$/.test(value)) return `site:${value}`;
    return `search:${input.trim()}`;
  },

  go(target, push = true) {
    this.loaded = true;
    nudge.clear();
    const key = typeof target === 'string' ? this.normalize(target) : 'start';
    if (push) {
      this.history = this.history.slice(0, this.index + 1);
      this.history.push(key);
      this.index = this.history.length - 1;
    }
    this.render(key);
  },

  render(key) {
    const { url, page, tab, back, fwd } = this.el;
    let html;
    let title;
    let address;
    let className = '';

    if (key.startsWith('search:')) {
      const query = key.slice(7);
      title = 'Search';
      address = `search.example/?q=${encodeURIComponent(query)}`;
      html = searchResults(query);
    } else if (key.startsWith('site:')) {
      const host = key.slice(5);
      title = host;
      address = host;
      html = `<div class="not-found"><div class="code">Practice mode</div><h1>${esc(host)} isn't available here</h1><p class="muted">This practice browser only opens example sites. Try <a data-go="weather.example">weather.example</a> or use the search box.</p><p><a data-go="start">Back to start</a></p></div>`;
    } else {
      const site = sites[key] || sites.start;
      title = site.title;
      address = key === 'start' ? '' : key;
      html = site.render();
      className = site.cls || '';
    }

    page.className = `page${className ? ` ${className}` : ''}`;
    page.innerHTML = html;
    page.scrollTop = 0;
    tab.textContent = title;
    url.value = address;

    bindSignin(page, {
      onAuthenticated: (mailAddress) => this.onAuthenticated?.(page, mailAddress),
      onBack: () => this.render('gmail.com'),
    });

    back.disabled = this.index <= 0;
    fwd.disabled = this.index >= this.history.length - 1;
    guide.update(key);

    const searchForm = page.querySelector('#start-search');
    if (searchForm) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = /** @type {HTMLInputElement} */ (page.querySelector('#start-q')).value;
        if (query.trim()) this.go(query);
      });
    }
  },

  back() {
    if (this.index > 0) {
      this.index--;
      this.render(this.history[this.index]);
    }
  },

  forward() {
    if (this.index < this.history.length - 1) {
      this.index++;
      this.render(this.history[this.index]);
    }
  },

  reset() {
    this.history = [];
    this.index = -1;
    this.loaded = false;
  },
};

export function bindBrowserChrome() {
  browser.el.url.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      browser.go(browser.el.url.value);
      browser.el.url.blur();
    }
  });

  browser.el.url.addEventListener('focus', () => {
    browser.barUsed = true;
    nudge.clear();
    browser.el.url.select();
  });

  browser.el.back.addEventListener('click', () => browser.back());
  browser.el.fwd.addEventListener('click', () => browser.forward());
  document.getElementById('b-reload').addEventListener('click', () => {
    browser.render(browser.history[browser.index] || 'start');
  });

  browser.el.page.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('[data-go]');
    if (!target) return;
    event.preventDefault();
    browser.go(/** @type {HTMLElement} */ (target).dataset.go);
  });
}
