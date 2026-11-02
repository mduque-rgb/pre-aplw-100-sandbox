```markdown
# Tablet Practice Sandbox

A web-based tablet simulator for email practice. The project replicates a browser and a Gmail-style inbox, guides the student through a seven-step mission, and generates a final report detailing their attempts, errors, and areas for improvement.

The project lives in the `pre-aplw-100-sandbox` directory.

## Description

This application is designed for people learning how to use email for the first time. Everything takes place within a simulated tablet using practice data: no actual emails are sent, and no information is transmitted to any server.

Instructions, tips and the report can be shown in **Spanish or English** (switch above the tablet). The simulated Gmail always keeps its English labels (`Inbox`, `Compose`, `Reply`, `Sign out`, etc.) so students get used to the vocabulary of the real app.

## Features

- Simulated tablet with a home screen, dock, clock, and browser.
- Practice browser with address bar, history, back/forward navigation, and sample sites.
- Simulated login with detailed hints to correct email address and password entries.
- Inbox with folders, search, read/unread emails, stars, and attachments.
- Email actions: reply, forward, compose, delete, restore, mark as spam, undo, and empty trash.
- Seven-step guided mission with visible progress tracking and a **“See my progress”** report available at any moment, so learners who stop early still get one.
- Finished writing steps (4–6) can be **practised again** from the report.
- Writing feedback: greeting, subject line, sign-off, clarity, politeness, date, purpose, attachments, spacing, and overly long sentences. A vague subject is shown as a tip and never blocks a step.
- Three different phishing emails (prize, bank, parcel), one per practice, each with its own warning signs. Add `?phish=prize|bank|package` to the address to choose one.
- Final report with statistics, areas for improvement, HTML download, copy-to-clipboard option, and a reset feature.
- Reading options: instructions language (Español/English), text size (100–150 %) and **Listen**, which reads the current instruction aloud with the browser's voice.
- Progress is saved in the browser, so a reload does not lose the practice.
- Works on tablets, computers and phones (on phones the tablet frame is dropped to use the whole screen).
- Keyboard navigation and accessible announcements using `aria-live` and focus management; messages stay on screen according to their length and pause while hovered or focused.

## How to Run

The project requires no installation or build process. It uses native HTML, CSS, and ES modules.

Requirements:

- A modern web browser with ES module support.
- A local static server. Do not open `index.html` using `file://`, as modules may be blocked by the browser.
- Node.js 20 or higher is required for the development tools and tests.

Using Node.js (no extra packages needed):

```bash
npm start
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

Or using Python:

```bash
python3 -m http.server 8000

```

Then open [http://localhost:8000](http://localhost:8000).

You can also use any other static server, for example:

```bash
npx serve .

```

## Practice Credentials

The application displays these credentials on screen:

```text
Email:    nicestudent@gmail.com
Password: L3arn7inG2026!

```

These are fictitious, public credentials. Do not enter real credentials.

## Practice Flow

1. Read three new emails.
2. Delete two emails that are no longer needed.
3. Identify and report a phishing email.
4. Reply to Sofía's email.
5. Request a day off from the manager using a formal email.
6. Send the correct invoice to a client.
7. Sign out and review the final report.

## Commands

| Command | Description |
| --- | --- |
| `npm start` | Serves the application at http://127.0.0.1:8000 (no dependencies). |
| `npm test` | Runs domain unit tests using `node:test`. |
| `npm run test:e2e` | Runs the full seven-step mission in a real browser with Playwright. |
| `npm run lint` | Checks the code with ESLint. |
| `npm run typecheck` | Verifies JSDoc types using TypeScript and `checkJs`. |
| `npm run check` | Lint + typecheck + unit tests in one go. |

The app itself has zero runtime dependencies. Run `npm install` once to get the development tools (ESLint, TypeScript, Playwright), and `npx playwright install chromium` before the first end-to-end run.

## Project Structure

```text
pre-aplw-100-sandbox/
├── css/
│   ├── base.css
│   ├── browser.css
│   ├── home.css
│   └── mail.css
├── js/
│   ├── auth/          Login and validations
│   ├── browser/       Simulated browser and sample sites
│   ├── learner/       Student's name
│   ├── mail/
│   │   ├── actions/   Email actions
│   │   ├── data/      Sample emails and attachments
│   │   ├── domain/    Pure logic: mission, analysis, issue catalog, state transitions
│   │   ├── ui/        Inbox rendering and UI components
│   │   ├── mission-steps.js  Named constants for the seven steps
│   │   ├── mount.js   Inbox mount point
│   │   ├── persist.js Saved progress (localStorage)
│   │   └── state.js   Main email state
│   ├── shared/        Shared utilities, including i18n.js (Spanish/English)
│   ├── shell/         Home screen, guide, welcome, reading tools (language, text size, listen)
│   └── main.js        Entry point and composition
├── tests/             Domain unit tests
├── e2e/               End-to-end tests (Playwright) and report snapshots
├── scripts/serve.js   Dependency-free local server
├── index.html
├── jsconfig.json
├── package.json
└── LICENSE

```

## Architecture

* `js/main.js` connects the core components of the application.
* The browser and email features are decoupled. The browser notifies login events via a callback without importing the mail module directly.
* Mission logic, writing analysis, attachment handling, and inbox transitions reside in `js/mail/domain/`.
* `js/mail/domain/issues.js` is the single catalog of mistakes the practice detects and the report categories they belong to. Add new warnings there, never as loose strings.
* Steps are referenced by name (`STEP.REPLY_SOFIA`) from `js/mail/mission-steps.js`, not by number.
* Texts are bilingual: `L('Hola', 'Hello')` returns the current language. Data that is stored or logged (issues, help entries, phishing signs) keeps both versions (`{ es, en }`) and is resolved when shown, so changing the language re-renders the report correctly. Static HTML carries both texts in `data-l="es"` / `data-l="en"` spans and CSS shows the active one.
* Message and mission state transitions return new data structures instead of mutating existing state.
* Modules utilize JSDoc with `checkJs` enabled in `jsconfig.json`.
* Zero frameworks, bundlers, or runtime dependencies.

## Testing

```bash
npm run check      # lint, types, unit tests
npm run test:e2e   # full mission in a browser
```

Unit tests cover:

* Email and password validation.
* Immutable message transitions.
* Mission state tracking and logging.
* Writing evaluation rules for Sofía, the manager, and the client.
* Analysis of subject lines, email bodies, and attachments.
* The issue catalog: every warning maps to a report category.

End-to-end tests complete the mission on tablet and desktop screens, once perfectly and once with typical mistakes, and compare the final report against snapshots in `e2e/__snapshots__/`. If you change report wording on purpose, update them with `npx playwright test --update-snapshots` and review the diff.

GitHub Actions runs all of the above on every push and pull request (`.github/workflows/ci.yml`).

## Privacy

* No real emails are sent.
* No calls to external services are made.
* Progress (the learner's name, the practice inbox and the mission log) is saved only in this browser's `localStorage`, so a reload does not lose the practice. It is never sent anywhere.
* Because the practice is often done on shared devices (for example, library tablets), saved progress expires after 12 hours, and **“Empezar de nuevo / Start over”** on the welcome screen deletes it immediately.
* The language and text-size choices are also remembered in this browser.
* Reports are generated locally.
* All included credentials are for practice purposes only.

## Before Submitting a Pull Request

```bash
npm run check
npm run test:e2e
```

Ensure the complete workflow runs as expected in a browser, and verify that no temporary files, local screenshots, `node_modules`, or `.DS_Store` files were added.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
