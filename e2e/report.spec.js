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
  for (const subject of ['Recordatorio: clase de correo electrónico esta noche', 'Tu parcela gratis del huerto está lista', 'Recordatorio de tu cita del jueves']) {
    await openMessage(page, subject);
    await act(page, 'back');
  }
  await openMessage(page, 'Los titulares de esta mañana');
  await act(page, 'del');

  await page.locator('.m-mission [data-act="report"]').click();
  await expect(page.locator('#fb-h')).toHaveText('Tu informe de avance');
  const report = await reportText(page);
  expect(report).toContain('1 de 7');
  expect(report).toContain('En curso');
  expect(report).toContain('Pendiente');
  expect(report).toMatchSnapshot('informe-parcial.txt');

  await expect(page.locator('.rp-x')).toBeVisible();
  await expect(page.locator('[data-act="report-continue"]')).toHaveText('Continuar con el paso 2 →');
  await page.locator('.rp-x').click();
  await expect(page.locator('.m-mission')).toContainText('Paso 2 de 7');
  await expect(page.locator('.m-mission')).toHaveClass(/m-flash/);
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

test('informe parcial: “Continuar con el paso” lleva directo a lo que falta', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);
  await page.locator('.m-mission [data-act="report"]').click();
  await page.locator('[data-act="report-continue"]').click();
  await expect(page.locator('.m-subject')).toHaveText('Fotos del fin de semana');
});
