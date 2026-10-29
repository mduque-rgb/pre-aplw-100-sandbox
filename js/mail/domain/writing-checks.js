import { esc } from '../../shared/dom.js';

export const fold = (text) => [...text]
  .map((character) => (character === '’' || character === '‘' ? "'" : character.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
  .join('')
  .toLowerCase();

const GREET_RE = /^\s*(hola|hi|hello|hey|dear|querid[oa]s?|estimad[oa]s?|buen(os|as)\s+(dias|tardes|noches)|buen dia|good\s+(morning|afternoon|evening)|greetings|saludos)\b/;
const BYE_RE = /\b(gracias|muchas gracias|thanks?|thank you|saludos|un saludo|un abrazo|abrazos?|abrazote|besos?|besitos|un beso|carinos?|con carino|te quiero|atentamente|cordialmente|love|lots of love|hugs?|kisses|xoxo|regards|best|sincerely|cheers|yours|take care|cuidate|see you|see ya|talk soon|talk to you soon|nos vemos|nos hablamos|hasta (?:pronto|luego|manana|entonces|la proxima|el (?:domingo|lunes|martes|miercoles|jueves|viernes|sabado))|chao|chau|ciao|adios|bye|goodbye|have a (?:nice|good|great) (?:day|week|weekend)|que tengas (?:un )?buen (?:dia|fin de semana)|feliz (?:dia|fin de semana))\b/;
const NAME_OK = new Set(['sofia', 'sofi', 'tom', 'laura', 'carlos', 'rivera', 'martinez']);

const FUT_YES = 'estare|ire|llegare|llevare|vendre|cenare|comere|pasare|asistire|nos veremos|te vere|ahi estare|alli estare|alla estare|(?:voy|vamos) a (?:ir|estar|llegar|llevar|cenar|comer|pasar|venir|asistir)|cuenta conmigo'
  + "|(?:i'll|i will|i shall|ill|i'm going to|i am going to|i'm gonna|i am gonna|we'll|we will|we're going to) (?:definitely |surely |totally |for sure |gladly |happily )?(?:be there|be over|come|go|make it|attend|join|bring|see you|stop by|drop by|be at|have dinner|eat)|will be there|see you (?:on )?sunday|see you then";
const FUT_NO = "no (?:estare|ire|llegare|vendre|podre|asistire|cenare)|no (?:voy|vamos) a (?:poder|ir|estar|llegar|venir|asistir)"
  + "|(?:i won't|i will not|i'll not|i'm not going to|i am not going to|i'm not gonna|i won't be able to|i will not be able to|we won't) (?:be able to )?(?:be there|come|go|make it|attend|join|be over)|won't be able|will not be able";
const FUT_FIND = new RegExp(String.raw`\b(?:${FUT_NO}|${FUT_YES})\b`);
const YES_RE = new RegExp(String.raw`\b(si|yes|yeah|yep|sure|claro|por supuesto|desde luego|of course|ok|okay|vale|absolutely|definitely|me encantaria|me encanta|con gusto|with pleasure|i would love|i'd love|count me in|nos vemos (?:el domingo|alli|ahi|entonces)|sounds (?:good|great|wonderful|lovely|perfect)|${FUT_YES})\b`);
const NO_RE = new RegExp(String.raw`\b(${FUT_NO}|no puedo|no me es posible|can't|cannot|can not|won't|will not|unable|lo siento|sorry|otro dia|another time|next time|la proxima)\b`);
const TOPIC_RE = /\b(cena|cenar|domingo|dinner|sunday|sopa|soup|tu casa|your house|come over|ir a cenar)\b/;
const WORDS = new Set(('a i y o e u yo tu el ella mi me te se le lo la los las un una unos unas de del al en con por para sin sobre que y pero si no ya muy mas menos tan bien mal hoy manana ayer aqui alli ahi este esta esto ese esa eso como cuando donde porque gracias hola adios saludos abrazo abrazos beso besos carino amor amiga amigo querida querido sofia sofi tom domingo sabado lunes cena cenar comida sopa casa tu tus su sus nuestro voy ire vamos ir puedo podre quiero quieres claro encanta encantaria gusta gusto nos vemos hasta pronto luego entonces llevo llevar llevare postre pan vino fotos foto lago picnic favorita bonita bonitas lindas lindo me gustaron gusto mucho muchas muchos todo todos toda todas tambien hora horas que se sera es son estoy esta estas estoy feliz contenta contento ver verte vernos invitacion invitarme invitar dia dias tarde tardes noche noches buenos buenas siempre nunca seguro segura perfecto perfecta '
  + 'hi hello hey dear yes yeah sure no not ok okay thanks thank you your yours my me we us our see soon love best regards cheers sincerely take care bye goodbye sunday saturday monday dinner soup house home come came coming over will would love like liked be been being there here the a an and but or so to too also of for from with at on in by it its is are was were am do does did can cant cannot sorry next time another day night evening morning afternoon photos photo picture pictures lake picnic favorite beautiful nice great good wonderful lovely perfect sounds sound bring bringing dessert bread wine cake what when where why how who that this these those then than them they he she him her his hers just very much many lot lots really all any some one two three four five six seven eight nine ten together another other others whatever wherever however something nothing everything anything someone everyone always never maybe today tonight tomorrow yesterday week weekend friend friends family know think hope wait cant have has had get got go going went make made happy glad excited invite invitation inviting thought thoughts wish wishes after before about again only still well already'
).split(/\s+/));

const ATT_MENTION_RE = /\b(adjunt\w*|attach\w*|enclosed|please find|le envio|te envio|les envio|le mando|te mando|aqui (?:esta|le envio|tiene)|here is|here's)\b/;
const DAYOFF_RE = /\b(dia libre|libre|dia de descanso|dia de permiso|permiso|ausentarme|ausencia|faltar|librar|tomar(?:me)? (?:el|un|este|ese|ese) dia|pedir(?:le)? (?:el|un) dia|no (?:podre|puedo|voy a poder|voy a|ire a|vendre a) ?(?:ir|venir|trabajar|asistir)?|no (?:ire|vendre|trabajare|asistire)|(?:take|have|get|request) (?:\w+ ){0,3}off|vacaciones|day off|days off|time off|a leave|leave of absence|take (?:the|a|this|that|next) (?:day|\w+day)|be off|be absent|miss work|personal day|vacation|pto)\b/;
const POLITE_RE = /\b(quisiera|me gustaria|podria|seria posible|es posible|le pido|le solicito|solicito|le agradeceria|agradeceria|por favor|would like|i'd like|could i|may i|can i|would it be possible|is it possible|i would appreciate|i'd appreciate|i am writing to ask|i'm writing to ask|please)\b/;
const DATE_RE = /\b((?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?: \d{1,2}(?: de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre))?)?|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:,? (?:(?:january|february|march|april|may|june|july|august|september|october|november|december) )?\d{1,2}(?:st|nd|rd|th)?)?|pasado manana|manana|tomorrow|(?:\d{1,2} de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?: \d{1,2})?|(?:january|february|march|april|june|july|august|september|october|november|december)(?: \d{1,2}(?:st|nd|rd|th)?)?|may \d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{1,2}(?:st|nd|rd|th)|next week|la proxima semana|la semana que viene)\b/;
const REASON_RE = /\b(porque|ya que|debido|cita|medic\w*|doctor|dentista|hospital|familia\w*|hij[oa]s?|madre|padre|mama|papa|nieto|boda|funeral|entierro|mudanza|tramite|asuntos? personales?|motivos? personales?|enferm\w*|because|due to|since|appointment|family|wedding|funeral|moving|personal reasons?|sick|doctor's)\b/;
const INFORMAL_BYE_RE = /\b(besos?|un beso|besitos|xoxo|love|lots of love|hugs?|kisses|te quiero|abrazos?|abrazote|un abrazo|carinos?|con carino)\b/;

function isNameLine(line) {
  const words = line
    .replace(/^[-–—~]\s*/, '')
    .replace(/[.!,]+$/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.length >= 1 && words.length <= 3 && words.every((word) => {
    if (!/^[A-Za-zÀ-ÿ'’-]{2,}$/.test(word)) return false;
    const folded = fold(word);
    return /^[A-ZÀ-ÖØ-Þ]/.test(word)
      ? !WORDS.has(folded) || NAME_OK.has(folded)
      : !WORDS.has(folded);
  });
}

function segment(token) {
  const shortWords = new Set(['i', 'a', 'y', 'o', 'yo', 'tu', 'mi', 'te', 'me', 'la', 'el', 'de', 'en', 'si', 'ya', 'no', 'my', 'we']);
  const isWord = (word) => WORDS.has(word) && (word.length >= 3 || shortWords.has(word));
  const best = new Array(token.length + 1).fill(null);
  best[0] = [];

  for (let end = 1; end <= token.length; end++) {
    for (let start = 0; start < end; start++) {
      if (best[start] && isWord(token.slice(start, end)) && (!best[end] || best[start].length + 1 < best[end].length)) {
        best[end] = [...best[start], token.slice(start, end)];
      }
    }
  }

  return best[token.length] && best[token.length].length >= 2 ? best[token.length] : null;
}

function findGlued(text, limit = 3) {
  const results = [];
  const seen = new Set();
  const add = (bad, fix) => {
    if (!seen.has(bad) && results.length < limit) {
      seen.add(bad);
      results.push({ bad, fix });
    }
  };

  let match;
  const punctuation = /([A-Za-zÀ-ÿ]+)([,.;:!?])([A-Za-zÀ-ÿ]{2,})/g;
  while ((match = punctuation.exec(text))) add(match[0], `${match[1]}${match[2]} ${match[3]}`);

  for (const token of text.split(/[^A-Za-zÀ-ÿ]+/)) {
    if (token.length < 4) continue;

    const camelCase = token.match(/^([A-Za-zÀ-ÿ]*[a-zà-ÿ])([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÿ]*)$/);
    if (camelCase && camelCase[1].length >= 2) {
      add(token, `${camelCase[1]} ${camelCase[2]}`);
      continue;
    }

    const folded = fold(token);
    if (WORDS.has(folded)) continue;

    const parts = segment(folded);
    if (parts) {
      let position = 0;
      add(token, parts.map((part) => {
        const value = token.slice(position, position + part.length);
        position += part.length;
        return value;
      }).join(' '));
    }
  }

  return results;
}

function findRunOns(text) {
  const results = [];
  for (const sentence of text.split(/[.!?¡¿…\n]+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    const joins = (fold(sentence).match(/\b(y|and|pero|but|so|entonces|then|because|porque|que)\b/g) || []).length;
    if (words.length > 25 || (words.length >= 16 && joins >= 3)) {
      results.push({ n: words.length, start: words.slice(0, 8).join(' ') });
    }
  }
  return results;
}

export function writingChecks(own, mode) {
  const isBoss = mode === 'boss';
  const isSofia = mode === 'sofia';
  const isClient = mode === 'client';
  const formal = isBoss || isClient;

  const glued = findGlued(own);
  let fixed = own;
  findGlued(own, 99).forEach((item) => {
    fixed = fixed.split(item.bad).join(item.fix);
  });

  const items = [];
  const lines = fixed.split('\n').map((line) => line.trim()).filter(Boolean);
  const lower = fold(fixed);
  const quote = (match) => esc(fixed.slice(match.index, match.index + match[0].length));
  const first = fold(lines[0] || '');
  const hasGreet = GREET_RE.test(first);
  const sentences = (line) => line.split(/(?<=[.!?…])\s+/).filter(Boolean);

  let tail = sentences(lines[lines.length - 1] || '').slice(-1)[0] || '';
  if (lines.length > 1 && lines[lines.length - 1].split(/\s+/).length <= 3) {
    tail = `${sentences(lines[lines.length - 2]).slice(-1)[0] || ''} ${tail}`;
  }

  const lastLine = lines[lines.length - 1] || '';
  const signed = lines.length > 1 && isNameLine(lastLine) && !GREET_RE.test(fold(lastLine));
  const byeAnywhere = BYE_RE.test(lower);
  const byeWords = BYE_RE.test(fold(tail));
  const hasBye = byeWords || signed;
  const req = { greet: hasGreet, bye: hasBye, answer: true, request: true, date: true, invoice: true, attMention: true };

  const greetingExample = isSofia ? 'Hola Sofía,' : isBoss ? 'Estimada Laura:' : isClient ? 'Estimado Carlos:' : 'Hola,';
  if (!hasGreet) {
    items.push({ ok: false, t: 'Falta el saludo', d: `Tu correo no empieza con un saludo. Escribe uno en la primera línea, por ejemplo: “${greetingExample}”.` });
  } else if (formal && /^\s*(hey|que tal|que onda|hola jef[ae])\b/.test(first)) {
    items.push({
      ok: false,
      t: 'Saludo muy informal',
      d: `Tu saludo es para un amigo, no para ${isBoss ? 'tu jefa' : 'un cliente'}. En el trabajo usa uno más formal, como ${isBoss ? '“Estimada Laura:” o “Buenos días, Laura:”' : '“Estimado Carlos:” o “Buenos días, Sr. Rivera:”'}.`,
    });
  } else {
    items.push({
      ok: true,
      t: 'Saludo',
      d: formal && /^\s*(estimad|buen|dear|good)/.test(first)
        ? 'Empezaste con un saludo formal, perfecto para un correo de trabajo.'
        : 'Empezaste con un saludo. Es una forma amable de comenzar.',
    });
  }

  if (isSofia) {
    const negative = lower.match(NO_RE);
    const answer = negative || lower.match(YES_RE);
    const topic = TOPIC_RE.test(lower);
    req.answer = Boolean(answer);
    const future = lower.match(FUT_FIND);
    const chosen = future || answer;
    const said = chosen ? quote(chosen) : '';
    const futureNote = future ? ' Usaste un verbo en futuro, ideal para hablar de lo que vas a hacer.' : '';
    const example = negative ? '“Lo siento, no podré ir a cenar el domingo.”' : '“Sí, estaré ahí el domingo.”';

    items.push(!answer
      ? { ok: false, t: 'Falta tu respuesta a su pregunta', d: 'Sofía te preguntó si quieres ir a cenar el domingo, pero tu correo no dice si vas a ir. Escríbelo claramente, por ejemplo: “¡Sí, estaré ahí el domingo!” o “Lo siento, no podré ir el domingo.”' }
      : topic
        ? { ok: true, t: 'Respuesta a su pregunta', d: `Contestaste su pregunta sobre la cena del domingo (“${said}”).${futureNote} Así Sofía sabe qué esperar.` }
        : { ok: true, t: 'Respuesta a su pregunta', d: `Contestaste su pregunta (“${said}”).${futureNote} Para que quede aún más claro, menciona la cena o el domingo, por ejemplo: ${example}` });
  }

  if (isBoss) {
    const dayOff = lower.match(DAYOFF_RE);
    const date = lower.match(DATE_RE);
    const polite = lower.match(POLITE_RE);
    const reason = lower.match(REASON_RE);
    req.request = Boolean(dayOff);
    req.date = Boolean(date);

    items.push(dayOff
      ? { ok: true, t: 'Tu petición', d: `Dijiste claramente lo que pides (“${quote(dayOff)}”).` }
      : { ok: false, t: 'Falta tu petición', d: 'Tu correo no dice que quieres un día libre. Escríbelo claramente, por ejemplo: “Quisiera pedirle el viernes libre.”' });

    items.push(date
      ? { ok: true, t: 'El día', d: `Dijiste qué día necesitas (“${quote(date)}”). Así tu jefa puede organizar el trabajo.` }
      : { ok: false, t: 'Falta el día', d: 'No dices qué día necesitas libre. Escribe el día o la fecha, por ejemplo: “el viernes 24 de octubre”.' });

    items.push(polite
      ? { ok: true, t: 'Cortesía', d: `Lo pediste con amabilidad (“${quote(polite)}”). Con un jefe, pedir en vez de avisar causa una buena impresión.` }
      : { ok: false, t: 'Pídelo con cortesía', d: 'Tu correo suena a aviso, no a petición. Usa una forma amable, como “¿Sería posible…?”, “Quisiera pedirle…” o “Le agradecería…”.' });

    items.push(reason
      ? { ok: true, t: 'El motivo', d: 'Explicaste por qué necesitas el día. Eso ayuda a tu jefa a entender tu petición.' }
      : { ok: false, t: 'Agrega el motivo', d: 'Es buena idea explicar brevemente por qué lo necesitas, por ejemplo: “porque tengo una cita médica”. No hace falta dar detalles privados.' });
  }

  if (isClient) {
    const invoice = lower.match(/\b(factura|invoice|bill)\b/);
    const number = /\b1045\b/.test(lower);
    const attachment = lower.match(ATT_MENTION_RE);
    req.invoice = Boolean(invoice);
    req.attMention = Boolean(attachment);

    items.push(!invoice
      ? { ok: false, t: 'Falta mencionar la factura', d: 'Tu mensaje no dice qué le envías al cliente. Escríbelo, por ejemplo: “Le envío la factura n.º 1045.”' }
      : number
        ? { ok: true, t: 'La factura', d: 'Dijiste de qué factura se trata (n.º 1045). Así el cliente sabe exactamente qué recibe.' }
        : { ok: false, t: 'Falta el número de factura', d: 'Mencionaste la factura, pero no su número. Agrega “n.º 1045” para que el cliente sepa cuál es.' });

    items.push(attachment
      ? { ok: true, t: 'Avisas del adjunto', d: `Le dijiste al cliente que va un archivo adjunto (“${quote(attachment)}”).` }
      : { ok: false, t: 'Avisa que va un adjunto', d: 'Escribe una frase que diga que el archivo va adjunto, por ejemplo: “Le adjunto la factura n.º 1045.” Así el cliente sabe que debe abrirlo.' });
  }

  const informal = formal && hasBye && INFORMAL_BYE_RE.test(fold(tail));
  const byeExample = formal ? '“Saludos cordiales,” o “Atentamente,”' : '“Un abrazo,” o “Gracias,”';

  items.push(!hasBye
    ? {
      ok: false,
      t: 'Falta la despedida',
      d: byeAnywhere
        ? `Usaste palabras amables, pero tu correo no termina con una despedida. Agrega una línea al final, como ${byeExample}, y debajo tu nombre.`
        : `Tu correo no tiene una línea de despedida. Al final escribe una, como ${byeExample}, y debajo tu nombre.`,
    }
    : informal
      ? { ok: false, t: 'Despedida muy informal', d: '“Besos” o “Un abrazo” son para amigos y familia. En un correo de trabajo usa “Saludos cordiales,” o “Atentamente,”, y debajo tu nombre.' }
      : {
        ok: true,
        t: 'Despedida',
        d: !byeWords
          ? `Cerraste firmando con tu nombre (“${esc(lastLine)}”).${formal ? ' En el trabajo también puedes agregar “Saludos cordiales,” antes de tu nombre.' : ' Si quieres, puedes agregar antes una despedida como “Un abrazo,”.'}`
          : formal
            ? 'Cerraste con una despedida adecuada para el trabajo.'
            : 'Cerraste con una despedida. Eso hace el mensaje más cortés.',
      });

  const runOns = findRunOns(own);
  items.push(runOns.length
    ? {
      ok: false,
      t: 'Oración demasiado larga',
      d: `${runOns.length === 1 ? 'Esta oración sigue y sigue' : 'Algunas oraciones siguen y siguen'} sin un punto: ${runOns.slice(0, 2).map((runOn) => `“${esc(runOn.start)}…” (${runOn.n} palabras)`).join(', ')}. Cuando termines una idea, pon un punto (.) y empieza la siguiente oración con mayúscula. Así es más fácil de leer.`,
    }
    : { ok: true, t: 'Oraciones', d: 'Tus oraciones tienen un buen largo y se leen con facilidad.' });

  items.push(glued.length
    ? {
      ok: false,
      t: 'Faltan espacios entre palabras',
      d: `Parece que algunas palabras quedaron pegadas: ${glued.map((item) => `<span class="fb-fix"><s>${esc(item.bad)}</s> → <b>${esc(item.fix)}</b></span>`).join(' ')} Pon un espacio entre cada palabra, y también después de cada coma o punto.`,
    }
    : { ok: true, t: 'Espacios', d: 'Separaste bien las palabras.' });

  return { items, req };
}

export { ATT_MENTION_RE };
