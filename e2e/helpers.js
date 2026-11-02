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
 * Welcome form → browser → gmail.com → sign in.
 * @param {import('@playwright/test').Page} page
 */
export async function signIn(page) {
  await page.goto('/');
  await page.locator('#wl-first').fill('Ana');
  await page.locator('#wl-last').fill('López');
  await page.getByRole('button', { name: 'Comenzar' }).click();

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
  const text = await page.locator('.rp-body').innerText();
  return text.replace(/Fecha: .*/, 'Fecha: <hoy>');
}
