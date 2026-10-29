import { esc } from '../shared/dom.js';

export const sites = {
  start: {
    title: 'Start Page',
    url: '',
    render: () => `
      <div class="start">
        <div class="big">Welcome</div>
        <form class="search-form" id="start-search">
          <input id="start-q" type="text" placeholder="Search the web" aria-label="Search the web">
          <button type="submit">Search</button>
        </form>
        <div class="favs">
          <button class="fav" data-go="gmail.com"><span class="sq" style="background:#d93025">M</span>Mail</button>
          <button class="fav" data-go="weather.example"><span class="sq" style="background:#2b7ef5">W</span>Weather</button>
          <button class="fav" data-go="news.example"><span class="sq" style="background:#d63a3a">N</span>Daily News</button>
          <button class="fav" data-go="library.example"><span class="sq" style="background:#1fb84a">L</span>Library</button>
          <button class="fav" data-go="recipes.example"><span class="sq" style="background:#f0a020">R</span>Recipes</button>
        </div>
        <p class="muted">Tip: tap the bar at the top, type a website address, then press <span class="kbd">return</span>.</p>
      </div>`,
  },
  'weather.example': {
    title: 'Weather',
    render: () => `
      <h1>Today's Weather</h1><p class="muted">Updated a few minutes ago</p>
      <p><strong>62°F</strong> and partly cloudy. High of 68°, low of 54°.</p>
      <h2>This week</h2>
      <p>Wednesday: Sunny, 70°<br>Thursday: Showers, 61°<br>Friday: Cloudy, 63°<br>Saturday: Sunny, 72°</p>
      <p><a data-go="news.example">Read the news</a> · <a data-go="start">Back to start</a></p>`,
  },
  'news.example': {
    title: 'Daily News',
    render: () => `
      <h1>Daily News</h1><p class="muted">Tuesday, October 13</p>
      <h2>Community garden opens on Elm Street</h2>
      <p>Neighbors gathered Saturday to plant the first beds. The garden offers free plots to residents, with sign-ups at the library.</p>
      <h2>Library adds evening computer classes</h2>
      <p>Beginner classes now run Tuesday and Thursday evenings. Topics include email, web searching, and online safety. <a data-go="library.example">See the schedule</a>.</p>
      <h2>Farmers market moves indoors for winter</h2>
      <p>Starting November, vendors will set up in the community center gym every Sunday morning.</p>`,
  },
  'library.example': {
    title: 'Public Library',
    render: () => `
      <h1>Public Library</h1>
      <p>Open Monday to Saturday, 9 a.m. to 8 p.m.</p>
      <h2>Computer classes</h2>
      <p>Tuesday 6 p.m. – Email basics<br>Thursday 6 p.m. – Searching the web<br>Saturday 10 a.m. – Staying safe online</p>
      <p>No sign-up needed. Bring your own device or use ours.</p>
      <p><a data-go="start">Back to start</a></p>`,
  },
  'gmail.com': {
    title: 'Sign in',
    cls: 'signin',
    render: () => `
      <div class="practice-banner" id="signin-banner">Practice page. Nothing you type here is sent anywhere. Practice email / Correo de práctica: <b>nicestudent@gmail.com</b></div>
      <div class="card">
        <div class="logo"><span class="m"><svg viewBox="0 0 48 48"><rect x="6" y="11" width="36" height="26" rx="4" fill="#fff"/><path d="M8 15l16 12 16-12" fill="none" stroke="#2b7ef5" stroke-width="2.5"/></svg></span>Mail</div>
        <h1 id="card-h1">Sign in</h1>
        <div class="sub" id="card-sub">to continue to Mail</div>
        <div class="who" id="who" hidden><span class="av" id="who-av" aria-hidden="true"></span><span id="who-mail"></span></div>
        <form id="signin-form" novalidate>
          <div class="field" id="signin-field">
            <input id="signin-email" type="text" inputmode="email" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder=" " aria-describedby="signin-tip">
            <label for="signin-email" id="signin-label">Email or phone</label>
            <div class="tip" id="signin-tip" role="alert" hidden>
              <span class="tip-arrow" aria-hidden="true"></span>
              <p class="tip-soft">No te preocupes, a todos nos pasa.</p>
              <p class="tip-title" id="tip-title"></p>
              <p class="tip-msg" id="tip-msg"></p>
              <p class="tip-fix" id="tip-fix"></p>
              <p class="tip-note" id="tip-note" hidden></p>
              <div class="tip-example"><span>Debe quedar así:</span><code id="tip-example">nicestudent@gmail.com</code></div>
              <button type="button" class="tip-ok" id="tip-ok">Entendido</button>
            </div>
          </div>
          <label class="show-pw" id="show-pw" hidden><input type="checkbox" id="show-pw-box"> Show password</label>
          <div class="pw-hint" id="pw-hint" hidden>
            <svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4 L6 32 H20 V56 H40 V32 H54 Z" fill="#e8232e" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>
            <p>Toca la casilla “Show password” si necesitas ver lo que estás escribiendo.</p>
          </div>
          <div class="err" id="signin-err"></div>
          <div><button type="button" class="link-btn" id="forgot-email">Forgot email?</button></div>
          <p class="help" id="card-help">Not your computer? Use a private window to sign in. This practice page never remembers what you type.</p>
          <div class="actions">
            <button type="button" class="link-btn" id="create-account">Create account</button>
            <button type="submit" class="btn-primary">Next</button>
          </div>
        </form>
      </div>
      <div class="foot"><span>English (United States)</span><span>Help</span><span>Privacy</span><span>Terms</span></div>`,
  },
  'recipes.example': {
    title: 'Simple Recipes',
    render: () => `
      <h1>Simple Recipes</h1>
      <h2>Tomato soup (serves 4)</h2>
      <p>Warm 1 tablespoon of oil in a pot. Add a chopped onion and cook until soft. Add two cans of tomatoes and 2 cups of broth. Simmer 20 minutes, then blend. Season with salt and pepper.</p>
      <h2>Oatmeal with apples</h2>
      <p>Cook 1 cup of oats in 2 cups of water. Stir in a chopped apple and a pinch of cinnamon.</p>
      <p><a data-go="start">Back to start</a></p>`,
  },
};

export const searchResults = (query) => `<h1>Results for “${esc(query)}”</h1>
  <div class="result"><div class="url">gmail.com</div><a data-go="gmail.com">Mail – Sign in</a><div>Sign in to read and send email.</div></div>
  <div class="result"><div class="url">weather.example</div><a data-go="weather.example">Today's Weather</a><div>Current conditions and a five-day forecast.</div></div>
  <div class="result"><div class="url">news.example</div><a data-go="news.example">Daily News</a><div>Local headlines, updated each morning.</div></div>
  <div class="result"><div class="url">library.example</div><a data-go="library.example">Public Library</a><div>Hours, computer classes and services.</div></div>
  <div class="result"><div class="url">recipes.example</div><a data-go="recipes.example">Simple Recipes</a><div>Easy meals with a few ingredients.</div></div>
  <p class="muted">This is a practice search page. Results are examples, not the real internet.</p>`;
