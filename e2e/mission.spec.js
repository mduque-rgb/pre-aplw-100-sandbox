import { expect, test } from '@playwright/test';
import {
  BOSS_OK,
  CLIENT_OK,
  SOFIA_OK,
  act,
  attach,
  doInboxSteps,
  fillCompose,
  finishSignOut,
  mailApp,
  reportText,
  signIn,
  startPractice,
} from './helpers.js';

test('misión perfecta: los 7 pasos a la primera', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);

  await act(page, 'mission-open');
  await act(page, 'reply');
  await fillCompose(page, { body: SOFIA_OK });
  await act(page, 'send');
  await expect(page.locator('.fb-mission')).toContainText('¡Paso 4 completado!');
  await act(page, 'fb-next');

  await act(page, 'mission-boss');
  await fillCompose(page, { to: 'laura.martinez@nice.com', subject: 'Solicitud de día libre', body: BOSS_OK });
  await act(page, 'send');
  await expect(page.locator('.fb-mission')).toContainText('¡Paso 5 completado!');
  await act(page, 'fb-next');

  await act(page, 'mission-client');
  await fillCompose(page, { to: 'carlos.rivera@cliente.com', subject: 'Factura n.º 1045', body: CLIENT_OK });
  await attach(page, 'Factura_1045_Rivera.pdf');
  await act(page, 'send');
  await expect(page.locator('.fb-mission')).toContainText('¡Paso 6 completado!');
  await act(page, 'fb-next');

  await finishSignOut(page);
  expect(await reportText(page)).toMatchSnapshot('informe-perfecto.txt');
});

test('misión con errores: el informe los registra y los agrupa', async ({ page }) => {
  await signIn(page);
  await doInboxSteps(page);

  // Paso 4: primero sin saludo ni despedida, luego bien.
  await act(page, 'mission-open');
  await act(page, 'reply');
  await fillCompose(page, { body: 'Sí, estaré ahí el domingo.' });
  await act(page, 'send');
  await expect(page.locator('.fb-retry')).toBeVisible();
  await act(page, 'fb-retry');
  await fillCompose(page, { body: SOFIA_OK });
  await act(page, 'send');
  await act(page, 'fb-next');

  // Paso 5: asunto en mayúsculas y despedida informal, luego bien.
  await act(page, 'mission-boss');
  await fillCompose(page, { to: 'laura.martinez@nice.com', subject: 'DIA LIBRE', body: 'Estimada Laura:\n\nQuisiera pedirle el viernes libre porque tengo una cita médica.\n\nBesos,\nAna' });
  await act(page, 'send');
  await act(page, 'fb-retry');
  await fillCompose(page, { subject: 'Solicitud de día libre', body: BOSS_OK });
  await act(page, 'send');
  await act(page, 'fb-next');

  // Paso 6: factura de otro cliente, luego la correcta.
  await act(page, 'mission-client');
  await fillCompose(page, { to: 'carlos.rivera@cliente.com', subject: 'Factura n.º 1045', body: CLIENT_OK });
  await attach(page, 'Factura_1044_Gomez.pdf');
  await act(page, 'send');
  await expect(page.locator('.fb-list')).toContainText('Archivo equivocado');
  await act(page, 'fb-retry');
  await mailApp(page).locator('[data-act="unattach"][data-f="Factura_1044_Gomez.pdf"]').click();
  await attach(page, 'Factura_1045_Rivera.pdf');
  await act(page, 'send');
  await act(page, 'fb-next');

  // Paso 7: cancela una vez y luego confirma.
  await act(page, 'signout');
  await act(page, 'so-cancel');
  await finishSignOut(page);

  const report = await reportText(page);
  expect(report).toContain('Saludar al principio');
  expect(report).toContain('Adjuntar archivos');
  expect(report).toMatchSnapshot('informe-con-errores.txt');
});

test('inicio de sesión: un correo mal escrito muestra una pista', async ({ page }) => {
  await startPractice(page);
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');

  await page.locator('#signin-email').fill('nicestudent gmail.com');
  await page.locator('#signin-email').press('Enter');
  await expect(page.locator('#signin-tip')).toBeVisible();
  expect(await page.locator('#signin-tip').innerText()).toMatchSnapshot('pista-correo.txt');
});
