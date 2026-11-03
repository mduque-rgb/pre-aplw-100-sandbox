/**
 * Fake (phishing) emails. Each practice uses one of them, so learners learn to
 * spot the warning signs rather than memorise a single email.
 *
 * In step 3 the learner plays detective: they tap the parts of the email that
 * look suspicious. Every email has the same six signs, in the order of SIGN.
 * `spots` are the exact pieces of the sender address, subject or body that count
 * as that sign when tapped; each must appear exactly once in its field, in both languages.
 */
import { bi } from '../../shared/i18n.js';

/**
 * @typedef {import('../../shared/i18n.js').Bilingual} Bilingual
 * @typedef {'addr'|'subject'|'body'} SignField
 * @typedef {Object} PhishingSpot
 * @property {SignField} field
 * @property {Bilingual|string} text  A string when it is the same in both languages (the address, a link).
 * @typedef {Object} PhishingSign
 * @property {Bilingual} title
 * @property {Bilingual} why     Shown when the learner finds it.
 * @property {readonly PhishingSpot[]} spots
 * @typedef {Object} PhishingEmail
 * @property {string} id
 * @property {Bilingual} from
 * @property {string} addr
 * @property {Bilingual} subject
 * @property {Bilingual} body
 * @property {PhishingSign[]} signs  One per SIGN, in that order.
 */

/** The six warning signs every fake email has, by position in `signs`. */
export const SIGN = Object.freeze({ SENDER: 0, BAIT: 1, SHOUTING: 2, HURRY: 3, PRIVATE: 4, LINK: 5 });
export const SIGN_COUNT = 6;

/** Where to look for each sign, for hints. Same for every email. */
export const SIGN_HINTS = Object.freeze([
  bi('Mira quién lo envía: la dirección que aparece junto al nombre.', 'Look at who sent it: the address next to the name.'),
  bi('¿Qué te ofrece o con qué te asusta? Lee el principio del mensaje.', 'What does it offer you, or what does it scare you with? Read the start of the message.'),
  bi('Fíjate en cómo está escrito el asunto: ¿hay palabras que gritan?', 'Look at how the subject is written: are there words that shout?'),
  bi('¿Cuánto tiempo te da para hacer lo que pide?', 'How much time does it give you to do what it asks?'),
  bi('¿Qué te pide que le envíes?', 'What does it ask you to send?'),
  bi('¿Hay alguna dirección web (www…) en el texto?', 'Is there a web address (www…) in the text?'),
]);

/**
 * @param {SignField} field
 * @param {Bilingual|string} text
 * @returns {PhishingSpot}
 */
const spot = (field, text) => Object.freeze({ field, text });
/**
 * @param {Bilingual} title
 * @param {Bilingual} why
 * @param {...PhishingSpot} spots
 * @returns {PhishingSign}
 */
const sign = (title, why, ...spots) => Object.freeze({ title, why, spots: Object.freeze(spots) });

/** @type {readonly PhishingEmail[]} */
export const PHISHING = Object.freeze([
  {
    id: 'prize',
    from: bi('Centro de Premios', 'Prize Center'),
    addr: 'claim-now@prize-winner-center.example',
    subject: bi('¡¡¡GANASTE una tarjeta de regalo de $500!!! Reclámala hoy', 'YOU WON a $500 gift card!!! Claim today'),
    body: bi(
      '¡¡¡FELICIDADES!!!\n\nFuiste elegido para recibir una tarjeta de regalo de $500.\n\nPara reclamar tu premio, responde con tu contraseña y tu fecha de nacimiento en las próximas 24 horas o lo perderás!!!\n\nTambién puedes reclamarlo aquí: www.prize-winner-now.example/claim\n\nEsta es tu ÚLTIMA oportunidad.',
      'CONGRATULATIONS!!!\n\nYou have been selected to receive a $500 gift card.\n\nTo claim your prize, reply with your password and date of birth within 24 hours or you will lose it!!!\n\nYou can also claim it here: www.prize-winner-now.example/claim\n\nThis is your LAST chance.',
    ),
    signs: [
      sign(bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>claim-now@prize-winner-center.example</b> no es de nadie que conozcas ni de una empresa real.', 'The address <b>claim-now@prize-winner-center.example</b> is not from anyone you know or from a real company.'),
        spot('addr', 'claim-now@prize-winner-center.example')),
      sign(bi('Un premio que no pediste', 'A prize you didn’t ask for'), bi('Dice que ganaste una tarjeta de regalo de $500, pero no participaste en ningún concurso.', 'It says you won a $500 gift card, but you did not enter any contest.'),
        spot('body', bi('Fuiste elegido para recibir una tarjeta de regalo de $500.', 'You have been selected to receive a $500 gift card.'))),
      sign(bi('Mayúsculas y muchos “!!!”', 'Capitals and lots of “!!!”'), bi('Grita “¡¡¡GANASTE!!!” y “¡¡¡FELICIDADES!!!” para emocionarte y que no pienses con calma.', 'It shouts “YOU WON” and “CONGRATULATIONS!!!” to excite you so you don’t think calmly.'),
        spot('subject', bi('¡¡¡GANASTE una tarjeta de regalo de $500!!! Reclámala hoy', 'YOU WON a $500 gift card!!! Claim today')),
        spot('body', bi('¡¡¡FELICIDADES!!!', 'CONGRATULATIONS!!!'))),
      sign(bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 24 horas y dice que es tu “ÚLTIMA oportunidad”, para que actúes rápido.', 'It gives you only 24 hours and says it is your “LAST chance”, so you act fast.'),
        spot('body', bi('en las próximas 24 horas o lo perderás!!!', 'within 24 hours or you will lose it!!!')),
        spot('body', bi('Esta es tu ÚLTIMA oportunidad.', 'This is your LAST chance.'))),
      sign(bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu contraseña y tu fecha de nacimiento. Ninguna empresa real te pide eso por correo.', 'It asks for your password and date of birth. No real company asks for that by email.'),
        spot('body', bi('responde con tu contraseña y tu fecha de nacimiento', 'reply with your password and date of birth'))),
      sign(bi('Un enlace sospechoso', 'A suspicious link'), bi('Te pide entrar en <b>www.prize-winner-now.example</b>. Los enlaces de los correos falsos llevan a páginas que roban tus datos. Nunca los toques: aquí solo lo estás señalando, no abriéndolo.', 'It asks you to go to <b>www.prize-winner-now.example</b>. Links in fake emails lead to pages that steal your data. Never tap them: here you are only pointing at it, not opening it.'),
        spot('body', 'www.prize-winner-now.example/claim')),
    ],
  },
  {
    id: 'bank',
    from: bi('Alerta de Seguridad Bancaria', 'Secure Bank Alert'),
    addr: 'security@secure-bank-alerts.example',
    subject: bi('URGENTE: Tu cuenta ha sido BLOQUEADA', 'URGENT: Your account has been LOCKED'),
    body: bi(
      'Estimado cliente:\n\nDetectamos actividad inusual y tu cuenta bancaria ha sido BLOQUEADA.\n\nPara desbloquearla, responde con tu número de tarjeta, tu PIN y tu contraseña en las próximas 12 horas, o tu cuenta se cerrará para siempre.\n\nO verifica tu cuenta aquí: www.secure-bank-verify.example/login\n\nDepartamento de Seguridad',
      'Dear customer,\n\nWe detected unusual activity and your bank account has been LOCKED.\n\nTo unlock it, reply with your card number, PIN and password within 12 hours, or your account will be closed forever.\n\nOr verify your account here: www.secure-bank-verify.example/login\n\nSecurity Department',
    ),
    signs: [
      sign(bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>security@secure-bank-alerts.example</b> no es la de tu banco. Los bancos escriben desde su propia dirección.', 'The address <b>security@secure-bank-alerts.example</b> is not your bank’s. Banks write from their own address.'),
        spot('addr', 'security@secure-bank-alerts.example')),
      sign(bi('Una amenaza para asustarte', 'A threat to scare you'), bi('Dice que tu cuenta está bloqueada y que la cerrarán para siempre. El miedo hace que actúes sin pensar.', 'It says your account is locked and will be closed forever. Fear makes you act without thinking.'),
        spot('body', bi('Detectamos actividad inusual y tu cuenta bancaria ha sido BLOQUEADA.', 'We detected unusual activity and your bank account has been LOCKED.')),
        spot('body', bi('o tu cuenta se cerrará para siempre.', 'or your account will be closed forever.'))),
      sign(bi('Mayúsculas que gritan', 'Shouting capitals'), bi('“URGENTE” y “BLOQUEADA” en mayúsculas buscan ponerte nervioso.', '“URGENT” and “LOCKED” in capitals are meant to make you nervous.'),
        spot('subject', bi('URGENTE: Tu cuenta ha sido BLOQUEADA', 'URGENT: Your account has been LOCKED'))),
      sign(bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 12 horas para que no tengas tiempo de llamar a tu banco y preguntar.', 'It gives you only 12 hours so you have no time to call your bank and ask.'),
        spot('body', bi('en las próximas 12 horas', 'within 12 hours'))),
      sign(bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu número de tarjeta, tu PIN y tu contraseña. Tu banco nunca te pide eso por correo.', 'It asks for your card number, PIN and password. Your bank never asks for that by email.'),
        spot('body', bi('responde con tu número de tarjeta, tu PIN y tu contraseña', 'reply with your card number, PIN and password'))),
      sign(bi('Un enlace sospechoso', 'A suspicious link'), bi('Te pide entrar en <b>www.secure-bank-verify.example</b>, que no es la página de tu banco. Nunca toques enlaces de correos así: aquí solo lo estás señalando, no abriéndolo. Si tienes dudas, escribe tú mismo la dirección de tu banco o llámalo.', 'It asks you to go to <b>www.secure-bank-verify.example</b>, which is not your bank’s website. Never tap links in emails like this: here you are only pointing at it, not opening it. If in doubt, type your bank’s address yourself or call them.'),
        spot('body', 'www.secure-bank-verify.example/login')),
    ],
  },
  {
    id: 'package',
    from: bi('Servicio de Paquetería', 'Parcel Delivery Service'),
    addr: 'delivery@parcel-redelivery.example',
    subject: bi('Paquete RETENIDO - paga $1.99 para recibirlo', 'Package ON HOLD - pay $1.99 to deliver'),
    body: bi(
      'Hola:\n\nNo pudimos entregar tu paquete porque falta pagar una tarifa de $1.99.\n\nPara recibirlo hoy, responde con tu nombre completo, tu dirección, tu número de tarjeta y su fecha de vencimiento. Si no pagas en las próximas 24 horas, el paquete será DEVUELTO.\n\nPaga aquí: www.parcel-fee-pay.example/pay\n\nNúmero de seguimiento: PK-48213',
      'Hello,\n\nYour package could not be delivered because of an unpaid fee of $1.99.\n\nTo receive it today, reply with your full name, home address, card number and expiry date. If you do not pay within 24 hours, the package will be RETURNED.\n\nPay here: www.parcel-fee-pay.example/pay\n\nTracking: PK-48213',
    ),
    signs: [
      sign(bi('Un remitente que no conoces', 'A sender you don’t know'), bi('La dirección <b>delivery@parcel-redelivery.example</b> no es de una empresa de envíos que conozcas.', 'The address <b>delivery@parcel-redelivery.example</b> is not from a delivery company you know.'),
        spot('addr', 'delivery@parcel-redelivery.example')),
      sign(bi('Un paquete que no esperabas', 'A package you weren’t expecting'), bi('No pediste nada, y el pago es tan pequeño ($1.99) que parece inofensivo. Así engañan a mucha gente.', 'You did not order anything, and the fee is so small ($1.99) that it seems harmless. That is how many people get fooled.'),
        spot('body', bi('No pudimos entregar tu paquete porque falta pagar una tarifa de $1.99.', 'Your package could not be delivered because of an unpaid fee of $1.99.'))),
      sign(bi('Mayúsculas que gritan', 'Shouting capitals'), bi('“RETENIDO” en mayúsculas busca que te preocupes.', '“ON HOLD” in capitals is meant to worry you.'),
        spot('subject', bi('Paquete RETENIDO - paga $1.99 para recibirlo', 'Package ON HOLD - pay $1.99 to deliver'))),
      sign(bi('Mucha prisa', 'A lot of hurry'), bi('Te da solo 24 horas antes de “devolver” el paquete, para que pagues sin pensar.', 'It gives you only 24 hours before “returning” the package, so you pay without thinking.'),
        spot('body', bi('Si no pagas en las próximas 24 horas, el paquete será DEVUELTO.', 'If you do not pay within 24 hours, the package will be RETURNED.'))),
      sign(bi('Pide datos privados', 'Asks for private data'), bi('Te pide tu dirección, tu número de tarjeta y su fecha de vencimiento. Con eso pueden robar tu dinero.', 'It asks for your address, card number and expiry date. With that they can steal your money.'),
        spot('body', bi('responde con tu nombre completo, tu dirección, tu número de tarjeta y su fecha de vencimiento', 'reply with your full name, home address, card number and expiry date'))),
      sign(bi('Un enlace sospechoso', 'A suspicious link'), bi('Te pide pagar en <b>www.parcel-fee-pay.example</b>. Los enlaces de los correos falsos llevan a páginas que roban los datos de tu tarjeta. Nunca los toques: aquí solo lo estás señalando, no abriéndolo.', 'It asks you to pay at <b>www.parcel-fee-pay.example</b>. Links in fake emails lead to pages that steal your card details. Never tap them: here you are only pointing at it, not opening it.'),
        spot('body', 'www.parcel-fee-pay.example/pay')),
    ],
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
