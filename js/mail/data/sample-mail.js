import { MAIL_ME } from '../account.js';
import { CONTACTS } from '../contacts.js';
import { PHISHING } from './phishing.js';
import { bi, tx } from '../../shared/i18n.js';

/**
 * @typedef {import('../types.js').MailMessage} MailMessage
 */

/**
 * The practice inbox's "today". Messages with this date show their time
 * instead of the date, and sent messages are stamped with it.
 */
export const TODAY = 'Oct 13';

/**
 * @typedef {string|import('../../shared/i18n.js').Bilingual} Text
 */

/**
 * Shows each practice email in the chosen language. Emails written by the
 * learner have no translations and stay exactly as they were typed.
 * @param {MailMessage[]} msgs
 * @returns {MailMessage[]}
 */
export function localizeMessages(msgs) {
  return msgs.map((message) => (message.i18n
    ? { ...message, from: tx(message.i18n.from), subject: tx(message.i18n.subject), body: tx(message.i18n.body) }
    : message));
}

/**
 * @param {import('./phishing.js').PhishingEmail} [phish]  Which fake email this inbox contains.
 */
export function sampleMail(phish = PHISHING[0]) {
  let nextId = 0;

  /**
   * @param {Text} from
   * @param {string} addr
   * @param {Text} subject
   * @param {string} date
   * @param {string} time
   * @param {Text} body
   * @param {Partial<MailMessage>} [options]
   * @returns {MailMessage}
   */
  const message = (from, addr, subject, date, time, body, options = {}) => ({
    id: ++nextId,
    from: tx(from),
    addr,
    subject: tx(subject),
    date,
    time,
    body: tx(body),
    i18n: { from, subject, body },
    to: MAIL_ME,
    folder: 'inbox',
    unread: false,
    starred: false,
    ...options,
  });

  return [
    message(
      CONTACTS.sofia.name, CONTACTS.sofia.email,
      bi('Fotos del fin de semana', 'Photos from the weekend'), TODAY, '9:12 AM',
      bi(
        '¡Hola!\n\nTe mando las fotos de nuestro picnic. La del lago es mi favorita.\n\n¿Quieres venir a cenar el domingo? Voy a hacer sopa.\n\nUn abrazo,\nSofía',
        'Hi!\n\nI am sending you the photos from our picnic. The one by the lake is my favorite.\n\nDo you want to come over for dinner on Sunday? I will make soup.\n\nLove,\nSofia',
      ),
      { unread: true },
    ),
    message(
      bi('Biblioteca Pública', 'Public Library'), 'classes@library.example',
      bi('Recordatorio: clase de correo electrónico esta noche', 'Reminder: Email basics class tonight'), TODAY, '8:30 AM',
      bi(
        'Hola:\n\nTe recordamos que la clase básica de correo electrónico empieza esta noche a las 6 p. m. en la sala de computadoras.\n\nNo hace falta inscribirse. Trae tu propio aparato o usa uno de los nuestros.\n\nTe esperamos,\nBiblioteca Pública',
        'Hello,\n\nThis is a friendly reminder that the Email basics class starts tonight at 6 p.m. in the computer room.\n\nNo sign-up is needed. Bring your own device or use one of ours.\n\nSee you there,\nPublic Library',
      ),
      { unread: true },
    ),
    message(
      bi('Noticias del Día', 'Daily News'), 'newsletter@news.example',
      bi('Los titulares de esta mañana', 'This morning\'s headlines'), TODAY, '6:00 AM',
      bi(
        '¡Buenos días!\n\n• Abre el huerto comunitario de Elm Street\n• La biblioteca agrega clases de computación por la noche\n• El mercado de agricultores se muda bajo techo por el invierno\n\nLee las noticias completas en el sitio web de Noticias del Día.',
        'Good morning!\n\n• Community garden opens on Elm Street\n• Library adds evening computer classes\n• Farmers market moves indoors for winter\n\nRead the full stories on the Daily News website.',
      ),
    ),
    message(
      bi('Huerto Comunitario de Elm Street', 'Elm Street Community Garden'), 'hello@garden.example',
      bi('Tu parcela gratis del huerto está lista', 'Your free garden plot is ready'), 'Oct 12', '4:05 PM',
      bi(
        '¡Buenas noticias! La parcela número 12 es tuya durante esta temporada.\n\nPor favor, pasa por la biblioteca antes del viernes para firmar un formulario corto. Las herramientas y regaderas son compartidas y están en el cobertizo azul.\n\n¡Feliz siembra!\nEl equipo del huerto',
        'Good news! Plot number 12 is now yours for the season.\n\nPlease stop by the library by Friday to sign the short form. Tools and watering cans are shared and kept in the blue shed.\n\nHappy planting,\nThe Garden Team',
      ),
      { unread: true },
    ),
    message(
      bi('Consultorio del Dr. Patel', 'Dr. Patel\'s Office'), 'frontdesk@clinic.example',
      bi('Recordatorio de tu cita del jueves', 'Appointment reminder for Thursday'), 'Oct 12', '11:20 AM',
      bi(
        'Hola:\n\nTe recordamos tu cita del jueves a las 10:30 a. m.\n\nPor favor, llega diez minutos antes y trae tu tarjeta del seguro. Si necesitas cambiar la hora, responde a este correo o llama a la recepción.\n\nGracias,\nRecepción',
        'Hello,\n\nThis is a reminder of your appointment on Thursday at 10:30 a.m.\n\nPlease arrive ten minutes early and bring your insurance card. If you need to change the time, reply to this email or call the front desk.\n\nThank you,\nFront Desk',
      ),
      { unread: true },
    ),
    message(
      bi('Alertas del Clima', 'Weather Alerts'), 'alerts@weather.example',
      bi('Se esperan lluvias el jueves', 'Showers expected on Thursday'), 'Oct 11', '5:45 PM',
      bi(
        'Se esperan lluvias el jueves con una máxima de 16 °C.\n\nLleva paraguas si vas a estar afuera en la mañana. El viernes estará nublado y el sábado debería estar soleado.',
        'Showers are expected on Thursday with a high of 61°F.\n\nBring an umbrella if you will be outside in the morning. Friday looks cloudy and Saturday should be sunny.',
      ),
    ),
    message(
      'Tom Becker', 'tom.becker@example.com',
      bi('¿Puedes regar mis plantas?', 'Can you water my plants?'), 'Oct 10', '2:15 PM',
      bi(
        'Hola, vecino:\n\nVoy a estar fuera la próxima semana. ¿Podrías regar las plantas de mi porche el lunes y el jueves? La regadera está junto a la puerta.\n\nMuchas gracias,\nTom',
        'Hi neighbor,\n\nI am away next week. Could you water the plants on my porch on Monday and Thursday? The watering can is by the door.\n\nThank you so much,\nTom',
      ),
    ),
    message(phish.from, phish.addr, phish.subject, 'Oct 9', '1:02 AM', phish.body, { unread: true, warn: true, phishId: phish.id }),
  ];
}
