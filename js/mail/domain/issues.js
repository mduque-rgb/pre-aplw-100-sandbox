/**
 * Single source of truth for the mistakes the practice can detect and how the
 * final report groups them.
 *
 * Every warning shown after sending an email, and every issue stored in the
 * mission log, must come from ISSUES. The report looks up each issue's category
 * here, so editing a title in one place keeps everything in sync.
 */

/**
 * @typedef {'greet'|'bye'|'subject'|'address'|'body'|'runon'|'spaces'|'answer'|'request'|'attach'|'tools'|'phish'|'logout'|'inbox'} IssueCategory
 */

/** Report section for each category: [title, advice]. */
export const CATEGORIES = Object.freeze({
  greet: ['Saludar al principio', 'Empieza siempre con un saludo en la primera línea: “Hola Sofía,” con amigos y familia, “Estimada Laura:” en el trabajo.'],
  bye: ['Despedirte al final', 'Termina con una despedida y tu nombre debajo: “Un abrazo,” con amigos, “Saludos cordiales,” o “Atentamente,” en el trabajo.'],
  subject: ['Escribir un asunto claro', 'Antes de tocar Send, revisa el cuadro “Subject”: unas pocas palabras que digan de qué trata, como “Factura n.º 1045”. Sin mayúsculas en todo.'],
  address: ['Escribir bien la dirección', 'Copia la dirección letra por letra. Revisa el @, el punto y el final (.com). Una dirección nunca lleva espacios.'],
  body: ['Escribir el mensaje', 'Antes de enviar, asegúrate de que el cuadro grande tenga tu mensaje: aunque sea corto, explica qué quieres decir.'],
  runon: ['Escribir oraciones cortas', 'Cuando termines una idea, pon un punto (.) y empieza la siguiente oración con mayúscula. Lee tu mensaje en voz alta para notarlo.'],
  spaces: ['Dejar espacios entre palabras', 'Deja un espacio entre cada palabra y después de cada coma o punto. Relee tu mensaje despacio antes de enviarlo.'],
  answer: ['Contestar lo que te preguntan', 'Lee con calma la pregunta del correo y contéstala claramente, por ejemplo: “Sí, estaré ahí el domingo.”'],
  request: ['Pedir algo con claridad y cortesía', 'Di qué pides, para qué día y por qué, con frases amables como “¿Sería posible…?” o “Quisiera pedirle…”.'],
  attach: ['Adjuntar archivos', 'Toca Attach, lee bien el nombre del archivo antes de elegirlo, revisa que solo vaya el correcto y menciona en tu mensaje que va adjunto.'],
  tools: ['Elegir el botón correcto', 'Para contestar un correo, ábrelo y toca Reply. Para escribir un correo nuevo, toca Compose.'],
  phish: ['Reconocer correos falsos', 'Desconfía de premios que no pediste, de la prisa y de quien te pide tu contraseña. Repórtalos con “Report spam”.'],
  logout: ['Cerrar tu sesión', 'Cuando termines de usar tu correo, toca “Sign out” y confirma. Cerrar el navegador o la pestaña no siempre cierra tu sesión, sobre todo en un aparato compartido.'],
  inbox: ['Organizar tu bandeja con cuidado', 'Antes de borrar un correo, mira quién lo envía y si todavía lo necesitas.'],
});

/**
 * @param {string} title  What the learner sees; also the key stored in the mission log.
 * @param {IssueCategory} category
 */
const issue = (title, category) => Object.freeze({ title, category });

export const ISSUES = Object.freeze({
  // Subject line
  NO_SUBJECT: issue('Falta el asunto', 'subject'),
  SUBJECT_ALL_CAPS: issue('Asunto en mayúsculas', 'subject'),
  SUBJECT_TOO_LONG: issue('Asunto muy largo', 'subject'),
  SUBJECT_UNCLEAR: issue('Asunto poco claro', 'subject'), // shown as a tip; never blocks a step
  // Body and writing
  EMPTY_BODY: issue('Mensaje vacío', 'body'),
  NO_GREETING: issue('Falta el saludo', 'greet'),
  INFORMAL_GREETING: issue('Saludo muy informal', 'greet'),
  NO_GOODBYE: issue('Falta la despedida', 'bye'),
  INFORMAL_GOODBYE: issue('Despedida muy informal', 'bye'),
  RUN_ON_SENTENCE: issue('Oración demasiado larga', 'runon'),
  GLUED_WORDS: issue('Faltan espacios entre palabras', 'spaces'),
  // Reply to Sofía
  NO_ANSWER: issue('Falta tu respuesta a su pregunta', 'answer'),
  // Day off request
  NO_REQUEST: issue('Falta tu petición', 'request'),
  NO_DATE: issue('Falta el día', 'request'),
  NOT_POLITE: issue('Pídelo con cortesía', 'request'),
  NO_REASON: issue('Agrega el motivo', 'request'),
  // Invoice and attachments
  NO_ATTACHMENT: issue('Falta el archivo adjunto', 'attach'),
  WRONG_ATTACHMENT: issue('Archivo equivocado', 'attach'),
  EXTRA_ATTACHMENTS: issue('Archivos de más', 'attach'),
  NO_ATTACHMENT_MENTION: issue('Avisa que va un adjunto', 'attach'),
  NO_INVOICE_MENTION: issue('Falta mencionar la factura', 'attach'),
  NO_INVOICE_NUMBER: issue('Falta el número de factura', 'attach'),
  // Inbox actions
  DELETED_SOFIA: issue('Borraste el correo de Sofía, que necesitabas después', 'inbox'),
  DELETED_PHISH: issue('Borraste el correo falso en lugar de reportarlo como spam', 'phish'),
  REPORTED_REAL_MAIL: issue('Reportaste como spam un correo real', 'phish'),
});

/** @type {Readonly<Record<string, IssueCategory>>} */
const CATEGORY_BY_TITLE = Object.freeze(
  Object.fromEntries(Object.values(ISSUES).map(({ title, category }) => [title, category])),
);

/**
 * Category of a logged issue, or undefined if the title is not in the catalog.
 * @param {string} title
 * @returns {IssueCategory|undefined}
 */
export const categoryOf = (title) => CATEGORY_BY_TITLE[title];
