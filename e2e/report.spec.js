import { expect, test } from '@playwright/test';
import {
  BOSS_OK,
  act,
  doInboxSteps,
  doWritingSteps,
  fillCompose,
  finishSignOut,
  openMessage,
  reportText,
  signIn,
} from './helpers.js';

test('informe parcial: quien no termina ve su avance hasta donde llegó', async ({ page }) => {
  await signIn(page);
  for (const subject of ['Reminder: Email basics class tonight', 'Your free garden plot is ready', 'Appointment reminder for Thursday']) {
    await openMessage(page, subject);
    await act(page, 'back');
  }
  await openMessage(page, 'This morning\'s headlines');
  await act(page, 'del');

  await page.locator('.m-mission [data-act="report"]').click();
  await expect(page.locator('#fb-h')).toHaveText('Tu informe de avance');
  const report = await reportText(page);
  expect(report).toContain('1 de 7');
  expect(report).toContain('En curso');
  expect(report).toContain('Pendiente');
  expect(report).toMatchSnapshot('informe-parcial.txt');

  await act(page, 'fb-close');
  await expect(page.locator('.m-mission')).toContainText('Paso 2 de 7');
});

test('practicar otra vez: un paso terminado se repite y se vuelve al informe', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);
  await doWritingSteps(page);
  await finishSignOut(page);

  await page.locator('[data-act="report-replay"][data-step="5"]').click();
  await expect(page.locator('.m-mission')).toContainText('Paso 5 de 7');
  await expect(page.locator('.m-mission')).toContainText('Práctica extra');

  await act(page, 'mission-boss');
  await fillCompose(page, { to: 'laura.martinez@nice.com', subject: 'Solicitud de día libre', body: BOSS_OK });
  await act(page, 'send');
  await expect(page.locator('.fb-mission')).toContainText('Completaste otra vez este paso');
  await page.locator('.fb-actions [data-act="report"]').click();

  await expect(page.locator('#fb-h')).toHaveText('Tu informe de práctica');
  await expect(page.locator('.rp-body')).toContainText('Practicado otra vez: 1 vez');
  await expect(page.locator('.rp-body')).toContainText('7 de 7');
});

test('un asunto poco claro es un consejo y no bloquea el paso', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);
  await act(page, 'mission-open');
  await act(page, 'reply');
  await fillCompose(page, { body: 'Hola Sofía,\n\nSí, estaré ahí el domingo.\n\nUn abrazo,\nAna' });
  await act(page, 'send');
  await act(page, 'fb-next');

  await act(page, 'mission-boss');
  await fillCompose(page, { to: 'laura.martinez@nice.com', subject: 'Una pregunta', body: BOSS_OK });
  await act(page, 'send');
  await expect(page.locator('.fb-item.info')).toContainText('Asunto poco claro');
  await expect(page.locator('.fb-mission')).toContainText('¡Paso 5 completado!');
});
