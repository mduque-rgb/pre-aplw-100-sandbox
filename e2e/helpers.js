import { expect } from '@playwright/test';

export const PRACTICE_EMAIL = 'nicestudent@gmail.com';
export const PRACTICE_PASSWORD = 'L3arn7inG2026!';

/** @param {import('@playwright/test').Page} page */
export const mailApp = (page) => page.locator('#mail-app');

/**
 * Clicks a mail button by its data-act attribute.
 * @param {import('@playwright/test').Page} page
 * @param {string} action
 */
export const act = (page, action) => mailApp(page).locator(`[data-act="${action}"]`).first().click();

/**
 * Opens the page and fills in the welcome form.
 * @param {import('@playwright/test').Page} page
 * @param {string} [path]
 */
export async function startPractice(page, path = '/?phish=prize') {
  await page.goto(path);
  // The home screen icons are built by the app script: once they exist, the form is wired up.
  await expect(page.locator('#apps .app').first()).toBeAttached();
  // The app moves focus to the first field shortly after load; wait so typing lands in the right box.
  await expect(page.locator('#wl-first')).toBeFocused();
  await page.locator('#wl-first').fill('Ana');
  await page.locator('#wl-last').fill('López');
  await page.locator('#wl-form button[type="submit"]').click();
  await expect(page.locator('#welcome')).toBeHidden();
}

/**
 * Welcome form → browser → gmail.com → sign in.
 * @param {import('@playwright/test').Page} page
 */
export async function signIn(page) {
  await startPractice(page);

  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');

  await page.locator('#signin-email').fill(PRACTICE_EMAIL);
  await page.locator('#signin-email').press('Enter');
  await page.locator('#signin-email').fill(PRACTICE_PASSWORD);
  await page.locator('#signin-email').press('Enter');

  await expect(mailApp(page)).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} subject
 */
export async function openMessage(page, subject) {
  // Tap the sender name: on narrow screens the row's centre can be a checkbox or quick button.
  await page.locator('.m-row', { hasText: subject }).locator('.m-from').click();
  await expect(page.locator('.m-subject')).toHaveText(subject);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{to?: string, subject?: string, body: string}} fields
 */
export async function fillCompose(page, { to, subject, body }) {
  if (to !== undefined) await page.locator('#mc-to').fill(to);
  if (subject !== undefined) await page.locator('#mc-sub').fill(subject);
  await page.locator('#mc-body').fill(body);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} fileName
 */
export async function attach(page, fileName) {
  await act(page, 'attach');
  await page.locator(`[data-act="pick"][data-f="${fileName}"]`).click();
}

/**
 * Report text without the date line, which changes every day.
 * @param {import('@playwright/test').Page} page
 */
export async function reportText(page) {
  // Same content as the downloaded report: on-screen buttons are left out.
  const text = await page.locator('.rp-body').evaluate((body) => {
    const copy = /** @type {HTMLElement} */ (body.cloneNode(true));
    copy.querySelectorAll('button').forEach((button) => button.remove());
    body.after(copy);
    const value = copy.innerText;
    copy.remove();
    return value;
  });
  return text.replace(/Fecha: .*/, 'Fecha: <hoy>');
}

export const SOFIA_OK = 'Hola Sofía,\n\nSí, estaré ahí el domingo para la cena.\n\nUn abrazo,\nAna';
export const BOSS_OK = 'Estimada Laura:\n\nQuisiera pedirle el viernes 24 de octubre libre porque tengo una cita médica.\n\nSaludos cordiales,\nAna López';
export const CLIENT_OK = 'Estimado Carlos:\n\nLe adjunto la factura n.º 1045.\n\nSaludos cordiales,\nAna López';

/** Steps 1–3: read three messages, delete two, report the phishing email. */
export async function doInboxSteps(page) {
  for (const subject of ['Reminder: Email basics class tonight', 'Your free garden plot is ready', 'Appointment reminder for Thursday']) {
    await openMessage(page, subject);
    await act(page, 'back');
  }
  await expect(page.locator('.m-mission')).toContainText('Paso 2 de 7');

  for (const subject of ['This morning\'s headlines', 'Showers expected on Thursday']) {
    await openMessage(page, subject);
    await act(page, 'del');
  }
  await expect(page.locator('.m-mission')).toContainText('Paso 3 de 7');

  await openMessage(page, 'YOU WON a $500 gift card!!! Claim today');
  await act(page, 'spam');
  await page.getByRole('checkbox', { name: 'Tiene prisa o una fecha límite' }).check();
  await page.getByRole('checkbox', { name: 'Creo que me pide información personal' }).check();
  await act(page, 'mr-next');
  await expect(page.locator('.fb-mission').first()).toContainText('¡Paso 3 completado!');
  await act(page, 'mr-close');
  await expect(page.locator('.m-mission')).toContainText('Paso 4 de 7');
}

export async function finishSignOut(page) {
  await act(page, 'signout');
  await act(page, 'so-confirm');
  await expect(page.locator('#m-out')).toContainText('¡Paso 7 completado!');
  await page.locator('#m-out [data-act="report"]').click();
  await expect(page.locator('.rp-body')).toBeVisible();
}

/** Steps 4–6 written correctly the first time. */
export async function doWritingSteps(page) {
  await act(page, 'mission-open');
  await act(page, 'reply');
  await fillCompose(page, { body: SOFIA_OK });
  await act(page, 'send');
  await act(page, 'fb-next');

  await act(page, 'mission-boss');
  await fillCompose(page, { to: 'laura.martinez@nice.com', subject: 'Solicitud de día libre', body: BOSS_OK });
  await act(page, 'send');
  await act(page, 'fb-next');

  await act(page, 'mission-client');
  await fillCompose(page, { to: 'carlos.rivera@cliente.com', subject: 'Factura n.º 1045', body: CLIENT_OK });
  await attach(page, 'Factura_1045_Rivera.pdf');
  await act(page, 'send');
  await act(page, 'fb-next');
}
