import { expect, test } from '@playwright/test';
import {
  act,
  doInboxSteps,
  doWritingSteps,
  openMessage,
  signIn,
  startPractice,
} from './helpers.js';

const readThree = async (page) => {
  for (const subject of ['Recordatorio: clase de correo electrónico esta noche', 'Tu parcela gratis del huerto está lista', 'Recordatorio de tu cita del jueves']) {
    await openMessage(page, subject);
    await act(page, 'back');
  }
};

test('idioma: las instrucciones cambian a inglés y vuelven a español al instante', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('.m-mission')).toContainText('Paso 1 de 7');

  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.m-mission')).toContainText('Step 1 of 7: Read your new emails.');
  // Gmail labels stay in English in both languages.
  await expect(page.locator('.m-compose-btn')).toContainText('Compose');

  await page.locator('.m-mission [data-act="report"]').click();
  await expect(page.locator('#fb-h')).toHaveText('Your progress report');
  await page.locator('.rp-x').click();

  await page.locator('[data-set-lang="es"]').click();
  await expect(page.locator('.m-mission')).toContainText('Paso 1 de 7');
});

test('idioma: la elección se recuerda y la bienvenida sale en inglés', async ({ page }) => {
  await page.goto('/?phish=prize');
  await page.locator('[data-set-lang="en"]').click();
  const visibleTitle = () => page.locator('#wl-h').evaluate((element) => element.innerText);
  expect(await visibleTitle()).toBe('Welcome!');
  await expect(page.locator('#wl-first')).toHaveAttribute('placeholder', 'Example: Maria');
  await page.reload();
  await expect(page.locator('#wl-h [data-l="en"]')).toBeVisible();
  expect(await visibleTitle()).toBe('Welcome!');
  await expect(page.locator('[data-set-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
});

test('tamaño de letra: A+ agranda el texto y se recuerda al recargar', async ({ page }) => {
  await page.goto('/?phish=prize');
  const size = () => page.locator('#screen').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const before = await size();

  await page.locator('#zoom-in').click();
  await page.locator('#zoom-in').click();
  await expect(page.locator('#zoom-level')).toHaveText('130%');
  // Phones grow more gently than tablets so the layout still fits, but the text always gets bigger.
  expect(await size()).toBeGreaterThan(before * 1.15);

  await page.reload();
  await expect(page.locator('#zoom-level')).toHaveText('130%');
  await page.locator('#zoom-out').click();
  await page.locator('#zoom-out').click();
  await expect(page.locator('#zoom-out')).toBeDisabled();
});

test('escuchar: lee en voz alta la instrucción que está en pantalla, en el idioma elegido', async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.speechSynthesis.speak = (utterance) => {
      window.__spoken.push({ text: utterance.text, lang: utterance.lang });
      setTimeout(() => utterance.onend?.(new Event('end')), 0);
    };
  });
  await signIn(page);
  await page.locator('#read-aloud').click();
  let spoken = await page.evaluate(() => window.__spoken.at(-1));
  expect(spoken.lang).toBe('es-ES');
  expect(spoken.text).toContain('Paso 1 de 7');

  await page.locator('[data-set-lang="en"]').click();
  await page.locator('#read-aloud').click();
  spoken = await page.evaluate(() => window.__spoken.at(-1));
  expect(spoken.lang).toBe('en-US');
  expect(spoken.text).toContain('Step 1 of 7');
});

test('guardar avance: al recargar se puede continuar donde se quedó', async ({ page }) => {
  await signIn(page);
  await readThree(page);
  await expect(page.locator('.m-mission')).toContainText('Paso 2 de 7');

  await page.reload();
  await expect(page.locator('#wl-resume-text')).toContainText('¡Hola de nuevo, Ana! Te quedaste en el paso 2 de 7.');
  await page.locator('#wl-continue').click();
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');
  await page.locator('#signin-email').fill('nicestudent@gmail.com');
  await page.locator('#signin-email').press('Enter');
  await page.locator('#signin-email').fill('L3arn7inG2026!');
  await page.locator('#signin-email').press('Enter');
  await expect(page.locator('.m-mission')).toContainText('Paso 2 de 7');
});

test('guardar avance: “Empezar de nuevo” borra lo guardado', async ({ page }) => {
  await signIn(page);
  await readThree(page);
  await page.reload();
  await page.locator('#wl-restart').click();
  await expect(page.locator('#wl-first')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('practice.progress.v1'))).toBeNull();
});

test('correos falsos distintos: el del banco tiene sus propias pistas', async ({ page }) => {
  await startPractice(page, '/?phish=bank');
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');
  await page.locator('#signin-email').fill('nicestudent@gmail.com');
  await page.locator('#signin-email').press('Enter');
  await page.locator('#signin-email').fill('L3arn7inG2026!');
  await page.locator('#signin-email').press('Enter');

  await expect(page.locator('.m-row', { hasText: 'Centro de Premios' })).toHaveCount(0);
  await openMessage(page, 'URGENTE: Tu cuenta ha sido BLOQUEADA');
  await act(page, 'spam');
  await page.getByRole('checkbox', { name: 'Creo que me pide información personal' }).check();
  await act(page, 'mr-next');
  await expect(page.locator('.m-fb')).toContainText('Tu banco nunca te pide eso por correo');
});

test('cerrar el navegador sin cerrar sesión aparece en “En qué enfocarte”', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);
  await doWritingSteps(page);
  await expect(page.locator('.m-mission')).toContainText('Paso 7 de 7');

  await page.locator('#b-close').click();
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');
  await page.locator('#signin-email').fill('nicestudent@gmail.com');
  await page.locator('#signin-email').press('Enter');
  await page.locator('#signin-email').fill('L3arn7inG2026!');
  await page.locator('#signin-email').press('Enter');

  await page.locator('.m-mission [data-act="report"]').click();
  await expect(page.locator('.rp-focus')).toContainText('Cerrar tu sesión');
});

test('idioma: los correos de la bandeja también cambian de idioma', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('.m-row', { hasText: 'Fotos del fin de semana' })).toBeVisible();
  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator('.m-row', { hasText: 'Photos from the weekend' })).toBeVisible();
  await openMessage(page, 'Photos from the weekend');
  await expect(page.locator('.m-text')).toContainText('Do you want to come over for dinner on Sunday?');
  await page.locator('[data-set-lang="es"]').click();
  await expect(page.locator('.m-text')).toContainText('¿Quieres venir a cenar el domingo?');
});
