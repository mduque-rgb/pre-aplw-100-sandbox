import { expect, test } from '@playwright/test';
import {
  act,
  attach,
  fillCompose,
  mailApp,
  openMessage,
  reportText,
  signIn,
} from './helpers.js';

const SOFIA_OK = 'Hola Sofía,\n\nSí, estaré ahí el domingo para la cena.\n\nUn abrazo,\nAna';
const BOSS_OK = 'Estimada Laura:\n\nQuisiera pedirle el viernes 24 de octubre libre porque tengo una cita médica.\n\nSaludos cordiales,\nAna López';
const CLIENT_OK = 'Estimado Carlos:\n\nLe adjunto la factura n.º 1045.\n\nSaludos cordiales,\nAna López';

/** Steps 1–3: read three messages, delete two, report the phishing email. */
async function doInboxSteps(page) {
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

async function finishSignOut(page) {
  await act(page, 'signout');
  await act(page, 'so-confirm');
  await expect(page.locator('#m-out')).toContainText('¡Paso 7 completado!');
  await act(page, 'report');
  await expect(page.locator('.rp-body')).toBeVisible();
}

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
  await page.goto('/');
  await page.locator('#wl-first').fill('Ana');
  await page.locator('#wl-last').fill('López');
  await page.getByRole('button', { name: 'Comenzar' }).click();
  await page.locator('.dock .app[data-app="browser"]').click();
  await page.locator('#b-url').fill('www.gmail.com');
  await page.locator('#b-url').press('Enter');

  await page.locator('#signin-email').fill('nicestudent gmail.com');
  await page.locator('#signin-email').press('Enter');
  await expect(page.locator('#signin-tip')).toBeVisible();
  expect(await page.locator('#signin-tip').innerText()).toMatchSnapshot('pista-correo.txt');
});
