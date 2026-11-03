import { expect, test } from '@playwright/test';
import { act, doReadAndDelete, findAllSigns, openMessage, signIn } from './helpers.js';

const PRIZE = '¡¡¡GANASTE una tarjeta de regalo de $500!!! Reclámala hoy';
const panel = (page) => page.locator('.m-detective');
const sign = (page, number) => page.locator(`.ph-seg[data-sign="${number}"]`).first();
const normal = (page) => page.locator('.ph-seg[data-sign="-1"]').first();

test('paso 3: sin “Mostrarme cuál es”; cada señal se marca y se cuenta', async ({ page }) => {
  await signIn(page);
  await doReadAndDelete(page);
  await expect(page.locator('.m-mission')).not.toContainText('Mostrarme cuál es');
  await expect(page.locator('[data-act="mission-phish"]')).toHaveCount(0);

  // The finding hint describes the email without opening it.
  await act(page, 'mission-find-hint');
  await expect(page.locator('.m-mission')).toContainText('busca un correo de alguien que no conoces');
  await expect(page.locator('.m-msg')).toHaveCount(0);

  await openMessage(page, PRIZE);
  await expect(panel(page)).toContainText('Sé detective');
  await expect(panel(page)).not.toContainText('Encontraste');

  await sign(page, 0).click();
  await expect(sign(page, 0)).toHaveClass(/found/);
  await expect(panel(page)).toContainText('Un remitente que no conoces');
  await expect(panel(page)).toContainText('Encontraste 1 de 6');

  // Tapping a found sign again does not count twice.
  await sign(page, 0).click();
  await expect(panel(page)).toContainText('Ya encontraste esta señal');
  await expect(panel(page)).toContainText('Encontraste 1 de 6');

  await sign(page, 5).click();
  await expect(panel(page)).toContainText('Un enlace sospechoso');
  await expect(panel(page)).toContainText('Encontraste 2 de 6');
  // The step box in the inbox shows the progress too.
  await act(page, 'back');
  await expect(page.locator('.m-mission').first()).toContainText('Señales encontradas: 2 de 6');
});

test('paso 3: tocar algo normal anima a seguir y, a la tercera, da una pista', async ({ page }) => {
  await signIn(page);
  await doReadAndDelete(page);
  await openMessage(page, PRIZE);

  await normal(page).click();
  await expect(panel(page)).toContainText('Eso parece normal. Sigue buscando.');
  await normal(page).click();
  await normal(page).click();
  await expect(panel(page)).toContainText('Pista:');
  await expect(panel(page)).toContainText('Mira quién lo envía');

  // Real emails can be inspected too, so opening one does not give the game away.
  await act(page, 'back');
  await openMessage(page, 'Recordatorio: clase de correo electrónico esta noche');
  await expect(panel(page)).toBeVisible();
  await act(page, 'ph-hint');
  await expect(panel(page)).toContainText('probablemente es real');
});

test('paso 3: reportarlo antes de tiempo pide seguir investigando, y se completa al encontrar todo', async ({ page }) => {
  await signIn(page);
  await doReadAndDelete(page);
  await openMessage(page, PRIZE);
  await sign(page, 3).click();

  await act(page, 'spam');
  await expect(page.locator('.m-fb')).toContainText('llevas 1 de 6');
  await expect(page.locator('.m-mission').first()).toContainText('Paso 3 de 7');

  await act(page, 'ph-reopen');
  await expect(page.locator('.m-nav.on')).toContainText('Spam');
  await expect(page.locator('.m-subject')).toContainText('GANASTE');

  await findAllSigns(page);
  await expect(page.locator('.m-fb')).toContainText('¡Caso resuelto, detective!');
  await expect(page.locator('.m-fb .fb-item')).toHaveCount(6);
  await act(page, 'mr-close');
  await expect(page.locator('.m-mission')).toContainText('Paso 4 de 7');
});

test('paso 3: las señales del correo del banco se explican con sus propias palabras, también con el teclado', async ({ page }) => {
  await page.goto('/?phish=bank');
  await page.locator('#wl-first').fill('Ana');
  await page.locator('#wl-last').fill('López');
  await page.locator('#wl-form button[type="submit"]').click();
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');
  await page.locator('#signin-email').fill('nicestudent@gmail.com');
  await page.locator('#signin-email').press('Enter');
  await page.locator('#signin-email').fill('L3arn7inG2026!');
  await page.locator('#signin-email').press('Enter');
  await doReadAndDelete(page);

  await openMessage(page, 'URGENTE: Tu cuenta ha sido BLOQUEADA');
  await sign(page, 4).focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toContainText('Tu banco nunca te pide eso por correo');
  await expect(sign(page, 4)).toBeFocused();
});
