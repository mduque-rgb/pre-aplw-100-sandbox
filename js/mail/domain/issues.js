/**
 * Single source of truth for the mistakes the practice can detect and how the
 * final report groups them.
 *
 * Every warning shown after sending an email, and every issue stored in the
 * mission log, must come from ISSUES. The log stores the issue id (for example
 * 'NO_GREETING'), so the report can show it in either language.
 */
import { bi, tx } from '../../shared/i18n.js';

/**
 * @typedef {'greet'|'bye'|'subject'|'address'|'body'|'runon'|'spaces'|'answer'|'request'|'attach'|'tools'|'phish'|'logout'|'inbox'} IssueCategory
 */

/** @param {import('../../shared/i18n.js').Bilingual} title @param {import('../../shared/i18n.js').Bilingual} advice */
const category = (title, advice) => Object.freeze({ title, advice });

/** Report section for each category. */
export const CATEGORIES = Object.freeze({
  greet: category(
    bi('Saludar al principio', 'Greet at the start'),
    bi('Empieza siempre con un saludo en la primera línea: “Hola Sofía,” con amigos y familia, “Estimada Laura:” en el trabajo.', 'Always start with a greeting on the first line: “Hi Sofía,” with friends and family, “Dear Laura,” at work.'),
  ),
  bye: category(
    bi('Despedirte al final', 'Say goodbye at the end'),
    bi('Termina con una despedida y tu nombre debajo: “Un abrazo,” con amigos, “Saludos cordiales,” o “Atentamente,” en el trabajo.', 'End with a closing and your name below it: “Hugs,” with friends, “Kind regards,” or “Sincerely,” at work.'),
  ),
  subject: category(
    bi('Escribir un asunto claro', 'Write a clear subject'),
    bi('Antes de tocar Send, revisa el cuadro “Subject”: unas pocas palabras que digan de qué trata, como “Factura n.º 1045”. Sin mayúsculas en todo.', 'Before tapping Send, check the “Subject” box: a few words that say what it is about, like “Invoice #1045”. Not all in capitals.'),
  ),
  address: category(
    bi('Escribir bien la dirección', 'Type the address correctly'),
    bi('Copia la dirección letra por letra. Revisa el @, el punto y el final (.com). Una dirección nunca lleva espacios.', 'Copy the address letter by letter. Check the @, the dot and the ending (.com). An address never has spaces.'),
  ),
  body: category(
    bi('Escribir el mensaje', 'Write the message'),
    bi('Antes de enviar, asegúrate de que el cuadro grande tenga tu mensaje: aunque sea corto, explica qué quieres decir.', 'Before sending, make sure the big box has your message: even if it is short, say what you mean.'),
  ),
  runon: category(
    bi('Escribir oraciones cortas', 'Write short sentences'),
    bi('Cuando termines una idea, pon un punto (.) y empieza la siguiente oración con mayúscula. Lee tu mensaje en voz alta para notarlo.', 'When you finish an idea, add a full stop (.) and start the next sentence with a capital letter. Read your message aloud to notice it.'),
  ),
  spaces: category(
    bi('Dejar espacios entre palabras', 'Leave spaces between words'),
    bi('Deja un espacio entre cada palabra y después de cada coma o punto. Relee tu mensaje despacio antes de enviarlo.', 'Leave a space between words and after every comma or full stop. Reread your message slowly before sending it.'),
  ),
  answer: category(
    bi('Contestar lo que te preguntan', 'Answer the question you were asked'),
    bi('Lee con calma la pregunta del correo y contéstala claramente, por ejemplo: “Sí, estaré ahí el domingo.”', 'Read the question in the email calmly and answer it clearly, for example: “Yes, I will be there on Sunday.”'),
  ),
  request: category(
    bi('Pedir algo con claridad y cortesía', 'Ask clearly and politely'),
    bi('Di qué pides, para qué día y por qué, con frases amables como “¿Sería posible…?” o “Quisiera pedirle…”.', 'Say what you are asking for, for which day and why, with polite phrases like “Would it be possible…?” or “I would like to ask…”.'),
  ),
  attach: category(
    bi('Adjuntar archivos', 'Attach files'),
    bi('Toca Attach, lee bien el nombre del archivo antes de elegirlo, revisa que solo vaya el correcto y menciona en tu mensaje que va adjunto.', 'Tap Attach, read the file name carefully before choosing it, check that only the right one is attached and mention the attachment in your message.'),
  ),
  tools: category(
    bi('Elegir el botón correcto', 'Choose the right button'),
    bi('Para contestar un correo, ábrelo y toca Reply. Para escribir un correo nuevo, toca Compose.', 'To answer an email, open it and tap Reply. To write a new email, tap Compose.'),
  ),
  phish: category(
    bi('Reconocer correos falsos', 'Spot fake emails'),
    bi('Desconfía de premios que no pediste, de la prisa y de quien te pide tu contraseña. Repórtalos con “Report spam”.', 'Be wary of prizes you did not ask for, of pressure to hurry and of anyone asking for your password. Report them with “Report spam”.'),
  ),
  logout: category(
    bi('Cerrar tu sesión', 'Sign out'),
    bi('Cuando termines de usar tu correo, toca “Sign out” y confirma. Cerrar el navegador o la pestaña no siempre cierra tu sesión, sobre todo en un aparato compartido.', 'When you finish using your email, tap “Sign out” and confirm. Closing the browser or the tab does not always sign you out, especially on a shared device.'),
  ),
  inbox: category(
    bi('Organizar tu bandeja con cuidado', 'Organise your inbox carefully'),
    bi('Antes de borrar un correo, mira quién lo envía y si todavía lo necesitas.', 'Before deleting an email, check who sent it and whether you still need it.'),
  ),
});

/**
 * @param {string} es  Title the learner sees in Spanish.
 * @param {string} en  Title in English.
 * @param {IssueCategory} cat
 */
const issue = (es, en, cat) => ({ title: bi(es, en), category: cat });

const DEFINITIONS = {
  // Subject line
  NO_SUBJECT: issue('Falta el asunto', 'Missing subject', 'subject'),
  SUBJECT_ALL_CAPS: issue('Asunto en mayúsculas', 'Subject in capitals', 'subject'),
  SUBJECT_TOO_LONG: issue('Asunto muy largo', 'Subject too long', 'subject'),
  SUBJECT_UNCLEAR: issue('Asunto poco claro', 'Unclear subject', 'subject'), // shown as a tip; never blocks a step
  // Body and writing
  EMPTY_BODY: issue('Mensaje vacío', 'Empty message', 'body'),
  NO_GREETING: issue('Falta el saludo', 'Missing greeting', 'greet'),
  INFORMAL_GREETING: issue('Saludo muy informal', 'Greeting too informal', 'greet'),
  NO_GOODBYE: issue('Falta la despedida', 'Missing closing', 'bye'),
  INFORMAL_GOODBYE: issue('Despedida muy informal', 'Closing too informal', 'bye'),
  RUN_ON_SENTENCE: issue('Oración demasiado larga', 'Sentence too long', 'runon'),
  GLUED_WORDS: issue('Faltan espacios entre palabras', 'Missing spaces between words', 'spaces'),
  // Reply to Sofía
  NO_ANSWER: issue('Falta tu respuesta a su pregunta', 'Missing your answer to her question', 'answer'),
  // Day off request
  NO_REQUEST: issue('Falta tu petición', 'Missing your request', 'request'),
  NO_DATE: issue('Falta el día', 'Missing the day', 'request'),
  NOT_POLITE: issue('Pídelo con cortesía', 'Ask politely', 'request'),
  NO_REASON: issue('Agrega el motivo', 'Add the reason', 'request'),
  // Invoice and attachments
  NO_ATTACHMENT: issue('Falta el archivo adjunto', 'Missing attachment', 'attach'),
  WRONG_ATTACHMENT: issue('Archivo equivocado', 'Wrong file', 'attach'),
  EXTRA_ATTACHMENTS: issue('Archivos de más', 'Extra files', 'attach'),
  NO_ATTACHMENT_MENTION: issue('Avisa que va un adjunto', 'Mention the attachment', 'attach'),
  NO_INVOICE_MENTION: issue('Falta mencionar la factura', 'Missing mention of the invoice', 'attach'),
  NO_INVOICE_NUMBER: issue('Falta el número de factura', 'Missing invoice number', 'attach'),
  // Inbox actions
  DELETED_SOFIA: issue('Borraste el correo de Sofía, que necesitabas después', 'You deleted Sofía’s email, which you needed later', 'inbox'),
  DELETED_PHISH: issue('Borraste el correo falso en lugar de reportarlo como spam', 'You deleted the fake email instead of reporting it as spam', 'phish'),
  REPORTED_REAL_MAIL: issue('Reportaste como spam un correo real', 'You reported a real email as spam', 'phish'),
};

/** @typedef {keyof typeof DEFINITIONS} IssueId */

/** @type {Readonly<Record<IssueId, {id: IssueId, title: import('../../shared/i18n.js').Bilingual, category: IssueCategory}>>} */
export const ISSUES = /** @type {any} */ (Object.freeze(Object.fromEntries(
  Object.entries(DEFINITIONS).map(([id, value]) => [id, Object.freeze({ id, ...value })]),
)));

/**
 * Category of a logged issue id, or undefined if it is not in the catalog.
 * @param {string} id
 * @returns {IssueCategory|undefined}
 */
export const categoryOf = (id) => ISSUES[id]?.category;

/**
 * Title of a logged issue in the current language.
 * @param {string} id
 */
export const issueLabel = (id) => (ISSUES[id] ? tx(ISSUES[id].title) : id);
