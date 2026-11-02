/**
 * Fake (phishing) emails. Each practice uses one of them, so learners learn to
 * spot the warning signs rather than memorise a single email.
 *
 * `signs` always follow the same order, which `reasons` refer to by index:
 *   0 unknown sender · 1 the bait (prize or threat) · 2 shouting style
 *   3 pressure to hurry · 4 asks for private data
 */
import { bi } from '../../shared/i18n.js';

/**
 * @typedef {import('../../shared/i18n.js').Bilingual} Bilingual
 * @typedef {Object} PhishingEmail
 * @property {string} id
 * @property {Bilingual} from
 * @property {string} addr
 * @property {Bilingual} subject
 * @property {Bilingual} body
 * @property {Bilingual} clues      Short clues for the step 3 box.
 * @property {Bilingual} readTip    Warning signs listed when the email is open.
 * @property {[Bilingual, Bilingual][]} signs  [title, explanation] × 5
 * @property {Record<'sender'|'request'|'urgency'|'good'|'personal', {sign: number[], t: Bilingual}>} reasons
 */

/** @type {readonly PhishingEmail[]} */
export const PHISHING = Object.freeze([
  {
    id: 'prize',
    from: bi('Centro de Premios', 'Prize Center'),
    addr: 'claim-now@prize-winner-center.example',
    subject: bi('¡¡¡GANASTE una tarjeta de regalo de $500!!! Reclámala hoy', 'YOU WON a $500 gift card!!! Claim today'),
    body: bi(
      '¡¡¡FELICIDADES!!!\n\nFuiste elegido para recibir una tarjeta de regalo de $500. Para reclamar tu premio, responde con tu contraseña y tu fecha de nacimiento en las próximas 24 horas o lo perderás!!!\n\nEsta es tu ÚLTIMA oportunidad.',
      'CONGRATULATIONS!!!\n\nYou have been selected to receive a $500 gift card. To claim your prize, reply with your password and date of birth within 24 hours or you will lose it!!!\n\nThis is your LAST chance.',
    ),
    clues: bi('dice que ganaste un premio, tiene mucha prisa y te pide tu contraseña', 'it says you won a prize, it is in a hurry and it asks for your password'),
    readTip: bi('un remitente que no conoces, un premio que no pediste, mucha prisa (“24 horas”) y te pide tu contraseña', 'a sender you don’t know, a prize you didn’t ask for, a lot of hurry (“24 hours”) and it asks for your password'),
    signs: [
      [bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>claim-now@prize-winner-center.example</b> no es de nadie que conozcas ni de una empresa real.', 'The address <b>claim-now@prize-winner-center.example</b> is not from anyone you know or from a real company.')],
      [bi('Un premio que no pediste', 'A prize you didn’t ask for'), bi('Dice que ganaste una tarjeta de regalo de $500, pero no participaste en ningún concurso.', 'It says you won a $500 gift card, but you did not enter any contest.')],
      [bi('Mayúsculas y muchos “!!!”', 'Capitals and lots of “!!!”'), bi('El asunto grita “¡¡¡GANASTE!!!” para emocionarte y que no pienses con calma.', 'The subject shouts “YOU WON” to excite you so you don’t think calmly.')],
      [bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 24 horas y dice que es tu “ÚLTIMA oportunidad”, para que actúes rápido.', 'It gives you only 24 hours and says it is your “LAST chance”, so you act fast.')],
      [bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu contraseña y tu fecha de nacimiento. Ninguna empresa real te pide eso por correo.', 'It asks for your password and date of birth. No real company asks for that by email.')],
    ],
    reasons: {
      sender: { sign: [0], t: bi('¡Bien visto! La dirección <b>claim-now@prize-winner-center.example</b> no es de nadie que conozcas ni de una empresa real.', 'Well spotted! The address <b>claim-now@prize-winner-center.example</b> is not from anyone you know or from a real company.') },
      request: { sign: [4], t: bi('Así es: te pide responder con tu contraseña y tu fecha de nacimiento. Eso es justo lo que buscan los estafadores.', 'That’s right: it asks you to reply with your password and date of birth. That is exactly what scammers want.') },
      urgency: { sign: [3], t: bi('Exacto: solo 24 horas y “ÚLTIMA oportunidad”. La prisa es para que actúes sin pensar con calma.', 'Exactly: only 24 hours and “LAST chance”. The hurry is so you act without thinking calmly.') },
      good: { sign: [1, 2], t: bi('¡Correcto! Un premio de $500 que no pediste es una de las trampas más comunes.', 'Correct! A $500 prize you didn’t ask for is one of the most common traps.') },
      personal: { sign: [4], t: bi('¡Correcto! Te pide tu contraseña y tu fecha de nacimiento. Ninguna empresa real te pide eso por correo.', 'Correct! It asks for your password and date of birth. No real company asks for that by email.') },
    },
  },
  {
    id: 'bank',
    from: bi('Alerta de Seguridad Bancaria', 'Secure Bank Alert'),
    addr: 'security@secure-bank-alerts.example',
    subject: bi('URGENTE: Tu cuenta ha sido BLOQUEADA', 'URGENT: Your account has been LOCKED'),
    body: bi(
      'Estimado cliente:\n\nDetectamos actividad inusual y tu cuenta bancaria ha sido BLOQUEADA.\n\nPara desbloquearla, responde con tu número de tarjeta, tu PIN y tu contraseña en las próximas 12 horas, o tu cuenta se cerrará para siempre.\n\nDepartamento de Seguridad',
      'Dear customer,\n\nWe detected unusual activity and your bank account has been LOCKED.\n\nTo unlock it, reply with your card number, PIN and password within 12 hours, or your account will be closed forever.\n\nSecurity Department',
    ),
    clues: bi('dice que tu cuenta del banco está bloqueada, te asusta con poco tiempo y te pide tu PIN y tu contraseña', 'it says your bank account is locked, scares you with little time and asks for your PIN and password'),
    readTip: bi('un remitente que no conoces, una amenaza (“BLOQUEADA”), mucha prisa (“12 horas”) y te pide tu PIN y tu contraseña', 'a sender you don’t know, a threat (“LOCKED”), a lot of hurry (“12 hours”) and it asks for your PIN and password'),
    signs: [
      [bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>security@secure-bank-alerts.example</b> no es la de tu banco. Los bancos escriben desde su propia dirección.', 'The address <b>security@secure-bank-alerts.example</b> is not your bank’s. Banks write from their own address.')],
      [bi('Una amenaza para asustarte', 'A threat to scare you'), bi('Dice que tu cuenta está bloqueada y que la cerrarán para siempre. El miedo hace que actúes sin pensar.', 'It says your account is locked and will be closed forever. Fear makes you act without thinking.')],
      [bi('Mayúsculas que gritan', 'Shouting capitals'), bi('“URGENTE” y “BLOQUEADA” en mayúsculas buscan ponerte nervioso.', '“URGENT” and “LOCKED” in capitals are meant to make you nervous.')],
      [bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 12 horas para que no tengas tiempo de llamar a tu banco y preguntar.', 'It gives you only 12 hours so you have no time to call your bank and ask.')],
      [bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu número de tarjeta, tu PIN y tu contraseña. Tu banco nunca te pide eso por correo.', 'It asks for your card number, PIN and password. Your bank never asks for that by email.')],
    ],
    reasons: {
      sender: { sign: [0], t: bi('¡Bien visto! <b>secure-bank-alerts.example</b> no es la dirección de un banco real.', 'Well spotted! <b>secure-bank-alerts.example</b> is not a real bank’s address.') },
      request: { sign: [4], t: bi('Así es: te pide responder con tu tarjeta, tu PIN y tu contraseña. Eso es justo lo que buscan los estafadores.', 'That’s right: it asks you to reply with your card, PIN and password. That is exactly what scammers want.') },
      urgency: { sign: [3, 2], t: bi('Exacto: “URGENTE” y solo 12 horas. La prisa es para que no llames a tu banco a preguntar.', 'Exactly: “URGENT” and only 12 hours. The hurry is so you don’t call your bank to ask.') },
      good: { sign: [1], t: bi('Este no promete un premio: te asusta con una amenaza. Premios y amenazas son las dos trampas más comunes.', 'This one does not promise a prize: it scares you with a threat. Prizes and threats are the two most common traps.') },
      personal: { sign: [4], t: bi('¡Correcto! Te pide tu PIN y tu contraseña. Tu banco nunca te pide eso por correo.', 'Correct! It asks for your PIN and password. Your bank never asks for that by email.') },
    },
  },
  {
    id: 'package',
    from: bi('Servicio de Paquetería', 'Parcel Delivery Service'),
    addr: 'delivery@parcel-redelivery.example',
    subject: bi('Paquete RETENIDO - paga $1.99 para recibirlo', 'Package ON HOLD - pay $1.99 to deliver'),
    body: bi(
      'Hola:\n\nNo pudimos entregar tu paquete porque falta pagar una tarifa de $1.99.\n\nPara recibirlo hoy, responde con tu nombre completo, tu dirección, tu número de tarjeta y su fecha de vencimiento. Si no pagas en las próximas 24 horas, el paquete será DEVUELTO.\n\nNúmero de seguimiento: PK-48213',
      'Hello,\n\nYour package could not be delivered because of an unpaid fee of $1.99.\n\nTo receive it today, reply with your full name, home address, card number and expiry date. If you do not pay within 24 hours, the package will be RETURNED.\n\nTracking: PK-48213',
    ),
    clues: bi('dice que tienes un paquete retenido, pide un pago pequeño con prisa y te pide los datos de tu tarjeta', 'it says a package is on hold, asks for a small payment in a hurry and asks for your card details'),
    readTip: bi('un remitente que no conoces, un paquete que no esperabas, mucha prisa (“24 horas”) y te pide los datos de tu tarjeta', 'a sender you don’t know, a package you weren’t expecting, a lot of hurry (“24 hours”) and it asks for your card details'),
    signs: [
      [bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>delivery@parcel-redelivery.example</b> no es de una empresa de envíos que conozcas.', 'The address <b>delivery@parcel-redelivery.example</b> is not from a delivery company you know.')],
      [bi('Un paquete que no esperabas', 'A package you weren’t expecting'), bi('No pediste nada, y el pago es tan pequeño ($1.99) que parece inofensivo. Así engañan a mucha gente.', 'You did not order anything, and the fee is so small ($1.99) that it seems harmless. That is how many people get fooled.')],
      [bi('Mayúsculas que gritan', 'Shouting capitals'), bi('“RETENIDO” y “DEVUELTO” en mayúsculas buscan que te preocupes.', '“ON HOLD” and “RETURNED” in capitals are meant to worry you.')],
      [bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 24 horas antes de “devolver” el paquete, para que pagues sin pensar.', 'It gives you only 24 hours before “returning” the package, so you pay without thinking.')],
      [bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu dirección, tu número de tarjeta y su fecha de vencimiento. Con eso pueden robar tu dinero.', 'It asks for your address, card number and expiry date. With that they can steal your money.')],
    ],
    reasons: {
      sender: { sign: [0], t: bi('¡Bien visto! <b>parcel-redelivery.example</b> no es una empresa de envíos real.', 'Well spotted! <b>parcel-redelivery.example</b> is not a real delivery company.') },
      request: { sign: [4], t: bi('Así es: te pide pagar respondiendo con los datos de tu tarjeta. Una empresa real no cobra así.', 'That’s right: it asks you to pay by replying with your card details. A real company does not charge like that.') },
      urgency: { sign: [3, 2], t: bi('Exacto: solo 24 horas y “DEVUELTO”. La prisa es para que pagues sin revisar.', 'Exactly: only 24 hours and “RETURNED”. The hurry is so you pay without checking.') },
      good: { sign: [1], t: bi('Es una trampa muy común: un pago tan pequeño parece inofensivo, pero lo que buscan es tu tarjeta.', 'It is a very common trap: such a small payment seems harmless, but what they want is your card.') },
      personal: { sign: [4], t: bi('¡Correcto! Te pide tu dirección y los datos de tu tarjeta. Nunca los envíes por correo.', 'Correct! It asks for your address and card details. Never send them by email.') },
    },
  },
]);

/**
 * The fake email for a new practice: `?phish=<id>` in the address picks one
 * (used by tests and teachers), otherwise one is chosen at random.
 * @returns {PhishingEmail}
 */
export function pickPhishing() {
  try {
    const requested = new URLSearchParams(window.location.search).get('phish');
    const match = PHISHING.find((email) => email.id === requested);
    if (match) return match;
  } catch {
    // No window (unit tests).
  }
  return PHISHING[Math.floor(Math.random() * PHISHING.length)];
}

/**
 * @param {string} [id]
 * @returns {PhishingEmail}
 */
export const phishingById = (id) => PHISHING.find((email) => email.id === id) || PHISHING[0];
