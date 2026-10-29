import { MAIL_ME } from '../account.js';
import { CONTACTS } from '../contacts.js';

/**
 * @typedef {import('../types.js').MailMessage} MailMessage
 */

export function sampleMail() {
  let nextId = 0;

  /**
   * @param {string} from
   * @param {string} addr
   * @param {string} subject
   * @param {string} date
   * @param {string} time
   * @param {string} body
   * @param {Partial<MailMessage>} [options]
   * @returns {MailMessage}
   */
  const message = (from, addr, subject, date, time, body, options = {}) => ({
    id: ++nextId,
    from,
    addr,
    subject,
    date,
    time,
    body,
    to: MAIL_ME,
    folder: 'inbox',
    unread: false,
    starred: false,
    ...options,
  });

  return [
    message(CONTACTS.sofia.name, CONTACTS.sofia.email, 'Photos from the weekend', 'Oct 13', '9:12 AM', 'Hi!\n\nI am sending you the photos from our picnic. The one by the lake is my favorite.\n\nDo you want to come over for dinner on Sunday? I will make soup.\n\nLove,\nSofia', { unread: true }),
    message('Public Library', 'classes@library.example', 'Reminder: Email basics class tonight', 'Oct 13', '8:30 AM', 'Hello,\n\nThis is a friendly reminder that the Email basics class starts tonight at 6 p.m. in the computer room.\n\nNo sign-up is needed. Bring your own device or use one of ours.\n\nSee you there,\nPublic Library', { unread: true }),
    message('Daily News', 'newsletter@news.example', 'This morning\'s headlines', 'Oct 13', '6:00 AM', 'Good morning!\n\n• Community garden opens on Elm Street\n• Library adds evening computer classes\n• Farmers market moves indoors for winter\n\nRead the full stories on the Daily News website.'),
    message('Elm Street Community Garden', 'hello@garden.example', 'Your free garden plot is ready', 'Oct 12', '4:05 PM', 'Good news! Plot number 12 is now yours for the season.\n\nPlease stop by the library by Friday to sign the short form. Tools and watering cans are shared and kept in the blue shed.\n\nHappy planting,\nThe Garden Team', { unread: true }),
    message('Dr. Patel\'s Office', 'frontdesk@clinic.example', 'Appointment reminder for Thursday', 'Oct 12', '11:20 AM', 'Hello,\n\nThis is a reminder of your appointment on Thursday at 10:30 a.m.\n\nPlease arrive ten minutes early and bring your insurance card. If you need to change the time, reply to this email or call the front desk.\n\nThank you,\nFront Desk', { unread: true }),
    message('Weather Alerts', 'alerts@weather.example', 'Showers expected on Thursday', 'Oct 11', '5:45 PM', 'Showers are expected on Thursday with a high of 61°F.\n\nBring an umbrella if you will be outside in the morning. Friday looks cloudy and Saturday should be sunny.'),
    message('Tom Becker', 'tom.becker@example.com', 'Can you water my plants?', 'Oct 10', '2:15 PM', 'Hi neighbor,\n\nI am away next week. Could you water the plants on my porch on Monday and Thursday? The watering can is by the door.\n\nThank you so much,\nTom'),
    message('Prize Center', 'claim-now@prize-winner-center.example', 'YOU WON a $500 gift card!!! Claim today', 'Oct 9', '1:02 AM', 'CONGRATULATIONS!!!\n\nYou have been selected to receive a $500 gift card. To claim your prize, reply with your password and date of birth within 24 hours or you will lose it!!!\n\nThis is your LAST chance.', { unread: true, warn: true }),
  ];
}
