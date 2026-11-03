import { esc } from '../../shared/dom.js';
import { L } from '../../shared/i18n.js';
import { issueLabel } from './issues.js';

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
const YES_RE = new RegExp(String.raw`\b(yes|yeah|yep|sure|claro|por supuesto|desde luego|of course|ok|okay|vale|absolutely|definitely|me encantaria|me encanta|con gusto|with pleasure|i would love|i'd love|count me in|can't wait|cannot wait|looking forward|no puedo esperar|tengo (?:muchas )?ganas|nos vemos (?:el domingo|alli|ahi|entonces)|sounds (?:good|great|wonderful|lovely|perfect)|${FUT_YES})\b`);
const NO_RE = new RegExp(String.raw`\b(${FUT_NO}|no puedo|no me es posible|(?:can't|cannot|can not)(?! wait)|won't|will not|unable|lo siento|sorry|otro dia|another time|next time|la proxima)\b`);
const TOPIC_RE = /\b(cena|cenar|domingo|dinner|sunday|sopa|soup|tu casa|your house|come over|ir a cenar)\b/;
// Doubt about going: “No sé si iré” or “Maybe I will come” do not tell Sofía what to expect.
const UNSURE_RE = /\b(no se si|no se todavia|todavia no se|aun no se|a ver si|te aviso si|te digo si|me pregunto si|let you know if|i wonder if|no estoy segur[oa]|tal vez|quizas?|a lo mejor|puede que|depende|probablemente|maybe|perhaps|not sure|(?:i )?don't know (?:if|whether|yet)|(?:i )?do not know (?:if|whether|yet)|i might|might be able|it depends|depends on|probably)\b/;
// Many tablets have no Spanish keyboard, so “si” without an accent counts as “sí” at the start or end of a phrase
// (“Si puedo ir”, “Si, claro”, “Pues si”). Real doubt (“no sé si”, “a ver si”) is caught by UNSURE_RE first.
const SI_YES_RE = /^si\b|\bsi$/;
const ACCENTED_SI_RE = /(?<!\p{L})sí(?!\p{L})/iu;
// “Sorry” alone is not a no: “Sorry, I don’t know if I can come” is still unsure.
const WEAK_NO_RE = /^(?:lo siento|sorry)$/;

/**
 * Finds the learner's answer to Sofía, judging each part of the reply on its own,
 * so a doubt in one part (“Quizás llegue tarde”) does not cancel a clear answer in another (“Sí, iré”).
 * @param {string} text the reply, with accents
 * @returns {{answer: string, negative: boolean, future: string, si?: boolean}|{unsure: string}|null}
 */
function findAnswer(text) {
  let weak = null;
  let unsure = null;
  const parts = text.split(/[.!?;,:\n¡¿…()"“”]+|\s(?:pero|but)\s/i).map((piece) => piece.trim()).filter(Boolean);
  const pick = (part, match) => part.slice(match.index, match.index + match[0].length);
  // The first future verb in a part without doubt, from `from` on: “Yes, I will be there” quotes “I will be there”.
  const futureFrom = (from) => {
    for (const part of parts.slice(from)) {
      const folded = fold(part);
      const future = !UNSURE_RE.test(folded) && folded.match(FUT_FIND);
      if (future) return pick(part, future);
    }
    return '';
  };

  for (const [index, part] of parts.entries()) {
    const folded = fold(part);
    if (UNSURE_RE.test(folded)) {
      unsure ??= part;
      continue;
    }

    const no = folded.match(NO_RE);
    const yes = folded.match(YES_RE) || part.match(ACCENTED_SI_RE) || folded.match(SI_YES_RE);
    if (no && WEAK_NO_RE.test(no[0]) && !yes) {
      weak ??= { answer: pick(part, no), negative: true, future: futureFrom(index + 1) };
      continue;
    }
    if (no || yes) {
      const future = futureFrom(index);
      const si = !no && !ACCENTED_SI_RE.test(part) && SI_YES_RE.test(folded);
      // For a plain “si”, quote the whole phrase (“Si puedo ir”), not just “Si”.
      return { answer: future || (si ? part : pick(part, no || yes)), negative: Boolean(no), future, si };
    }
  }

  return unsure ? { unsure } : weak;
}

// Known words, per language. They tell a signature name from ordinary words, and they are the
// pieces the glued-words check may split a token into (always within one language).
const WORDS_ES = new Set(('a y o e u yo tu el ella mi me te se le lo la los las un una unos unas de del al en con por para sin sobre que y pero si no ya muy mas menos tan bien mal hoy manana ayer aqui alli ahi este esta esto ese esa eso como cuando donde porque gracias hola adios saludos abrazo abrazos beso besos carino amor amiga amigo querida querido sofia sofi tom domingo sabado lunes cena cenar comida sopa casa tu tus su sus nuestro voy ire vamos ir puedo podre quiero quieres claro encanta encantaria gusta gusto nos vemos hasta pronto luego entonces llevo llevar llevare postre pan vino fotos foto lago picnic favorita bonita bonitas lindas lindo me gustaron gusto mucho muchas muchos todo todos toda todas tambien hora horas que se sera es son estoy esta estas estoy feliz contenta contento ver verte vernos invitacion invitarme invitar dia dias tarde tardes noche noches buenos buenas siempre nunca seguro segura perfecto perfecta '
  + 'ellos ellas usted ustedes nosotros conmigo contigo sino tuya tuyo tuyas tuyos dame deme dime dele media medio medias mismo misma nota notas tema temas mesa sido ahora ademas malo mala favor libre libres '
  + 'factura adjunto archivo correo mensaje asunto jefa jefe cliente cita trabajo oficina semana viernes jueves miercoles martes necesito quisiera podria pedir envio mando estare estamos tengo tiene'
).split(/\s+/));
const WORDS_EN = new Set(('i hi hello hey dear yes yeah sure no not ok okay thanks thank you your yours my me we us our see soon love best regards cheers sincerely take care bye goodbye sunday saturday monday dinner soup house home come came coming over will would love like liked be been being there here the a an and but or so to too also of for from with at on in by it its is are was were am do does did can cant cannot sorry next time another day night evening morning afternoon photos photo picture pictures lake picnic favorite beautiful nice great good wonderful lovely perfect sounds sound bring bringing dessert bread wine cake what when where why how who that this these those then than them they he she him her his hers just very much many lot lots really all any some one two three four five six seven eight nine ten together another other others whatever wherever however something nothing everything anything someone everyone always never maybe today tonight tomorrow yesterday week weekend friend friends family know think hope wait cant have has had get got go going went make made happy glad excited invite invitation inviting thought thoughts wish wishes after before about again only still well already '
  + 'note notes late later idea area side site media theme queen formal forget forgot invoice attached attach file manager client work office request reason appointment friday thursday wednesday tuesday need '
  + 'panel parade estate versus delete candid convoy washer gotten hasten siesta mediate denote notate envoy'
).split(/\s+/));
const WORDS = new Set([...WORDS_ES, ...WORDS_EN]);

const ATT_MENTION_RE = /\b(adjunt\w*|attach\w*|enclosed|please find|le envio|te envio|les envio|le mando|te mando|le (?:remito|comparto|hago llegar)|te (?:remito|comparto)|aqui (?:esta|le envio|tiene)|here is|here's|here you (?:have|go)|(?:i'm|i am|we're|we are) sending|send(?:ing)? you|sent you|you(?:'ll| will) find)\b/;
const DAYOFF_RE = /\b(dia libre|libre|dia de descanso|dia de permiso|dia personal|permiso|ausentarme|ausencia|faltar|librar|tomar(?:me)? (?:el|un|este|ese|ese) dia|pedir(?:le)? (?:el|un) dia|no (?:podre|puedo|voy a poder|voy a|ire a|vendre a) ?(?:ir|venir|trabajar|asistir)?|no (?:ire|vendre|trabajare|asistire)|(?:take|have|get|request|ask for|asking for|need|want|would like|i'd like) (?:\w+ ){0,3}off|\w+day off|vacaciones|day off|days off|time off|a leave|leave of absence|take (?:the|a|this|that|next) (?:day|\w+day)|be off|be absent|be away|miss work|(?:won't|will not|can't|cannot|can not) (?:be able to )?(?:come (?:in|to work)|work|be at work|go to work)|personal day|vacation|pto)\b/;
const POLITE_RE = /\b(quisiera|me gustaria|podria|seria posible|es posible|le pido|le solicito|solicito|le agradeceria|agradeceria|por favor|le importaria|seria tan amable|me permitiria|would like|i'd like|could i|may i|can i|could you|would you|would it be possible|is it possible|i would appreciate|i'd appreciate|i would be grateful|i was wondering|i am writing to ask|i'm writing to ask|kindly|please)\b/;
const DATE_RE = /\b((?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?: \d{1,2}(?: de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre))?)?|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:,? (?:(?:january|february|march|april|may|june|july|august|september|october|november|december) )?\d{1,2}(?:st|nd|rd|th)?)?|pasado manana|manana|tomorrow|(?:\d{1,2} de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?: \d{1,2})?|(?:january|february|march|april|june|july|august|september|october|november|december)(?: \d{1,2}(?:st|nd|rd|th)?)?|may \d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{1,2}(?:st|nd|rd|th)|next week|la proxima semana|la semana que viene)\b/;
const REASON_RE = /\b(porque|ya que|debido|cita|consulta|medic\w*|doctor|dentista|hospital|cirugia|operacion|familia\w*|hij[oa]s?|nin[oa]s?|madre|padre|mama|papa|espos[oa]|marido|abuel[oa]s?|niet[oa]s?|escuela|colegio|juzgado|boda|funeral|entierro|mudanza|tramite|asuntos? personales?|motivos? personales?|enferm\w*|because|due to|since|appointment|medical|dentist|surgery|operation|family|sons?|daughters?|child|children|kids?|baby|mother|father|mom|mum|dad|parents?|husband|wife|grand(?:son|daughter|child|children|mother|father|ma|pa)s?|school|court|wedding|funeral|moving|personal (?:reasons?|matters?)|sick|unwell|illness|doctor's)\b/;
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

// Short words that may be a piece of a glued token (“sivoy” → “si voy”, “iwill” → “i will”).
// Other one- and two-letter words are never pieces, and a split uses at most one short piece:
// too many real words start or end with them (idea, theme, often, delete).
const SHORT_PARTS_ES = new Set(['yo', 'tu', 'mi', 'te', 'me', 'la', 'el', 'de', 'en', 'si', 'ya', 'no']);
const SHORT_PARTS_EN = new Set(['i', 'my', 'we', 'no']);
const MIN_GLUED = 5;
const MAX_PARTS = 3;

// English writes many real words as one (anyone, someday, overall, weekday): never split those.
const EN_COMPOUND_RE = /^(?:any|some|every|no|over|after|under|out|up|with|where|there|here|what|who|how|home|week|day|night|good|tea|lake|wine|house|for|fore|be|in)[a-z]{2,}$|^[a-z]{2,}(?:one|body|thing|where|how|when|why|what|time|times|day|days|self|selves|ever|side|like|some|ward|wards|more|less|ness|house|land|made)$/;

/**
 * Splits a token into 2–3 known words of one language,
 * or returns null when it is not clearly two words stuck together.
 * @param {string} token folded, lower case
 * @returns {string[]|null}
 */
function segment(token) {
  if (token.length < MIN_GLUED) return null;

  const split = (words, short) => {
    const isPart = (word) => words.has(word) && (word.length >= 3 || short.has(word));
    const best = new Array(token.length + 1).fill(null);
    best[0] = [];

    for (let end = 1; end <= token.length; end++) {
      for (let start = 0; start < end; start++) {
        if (best[start] && isPart(token.slice(start, end)) && (!best[end] || best[start].length + 1 < best[end].length)) {
          best[end] = [...best[start], token.slice(start, end)];
        }
      }
    }

    const parts = best[token.length];
    const shortCount = parts ? parts.filter((part) => part.length < 3).length : 0;
    return parts && parts.length >= 2 && parts.length <= MAX_PARTS && shortCount <= 1 ? parts : null;
  };

  return split(WORDS_ES, SHORT_PARTS_ES) || (EN_COMPOUND_RE.test(token) ? null : split(WORDS_EN, SHORT_PARTS_EN));
}

// Email addresses, web addresses and domains have no spaces on purpose (ana.perez@gmail.com, www.example.com).
const ADDRESS_RE = /\S+@\S+|\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|edu|gov|es|mx|co|us|io|info|example)\b/gi;
// A signature line with only contact details: “ana.perez@gmail.com”, “Tel: 555-123-4567”, “www.example.com”.
const CONTACT_LINE_RE = /^(?:(?:tel|phone|telefono|tlf|cel|cell|celular|mobile|movil|email|e-mail|correo|web)\.?\s*:?\s*)?(?:\S+@\S+|(?:https?:\/\/|www\.)\S+|[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|edu|gov|es|mx|co|us|io|info|example)|\+?[\d\s().-]{7,})$/i;

function findGlued(rawText, limit = 3) {
  const text = rawText.replace(ADDRESS_RE, ' ');
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
  // Contact details under the name are part of the signature, not the last line of the message.
  while (lines.length > 1 && CONTACT_LINE_RE.test(lines[lines.length - 1])) lines.pop();
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

  const greetingExample = isSofia ? L('Hola Sofía,', 'Hi Sofía,') : isBoss ? L('Estimada Laura:', 'Dear Laura,') : isClient ? L('Estimado Carlos:', 'Dear Carlos,') : L('Hola,', 'Hello,');
  if (!hasGreet) {
    items.push({ ok: false, id: 'NO_GREETING', t: issueLabel('NO_GREETING'), d: L(`Tu correo no empieza con un saludo. Escribe uno en la primera línea, por ejemplo: “${greetingExample}”.`, `Your email does not start with a greeting. Write one on the first line, for example: “${greetingExample}”.`) });
  } else if (formal && /^\s*(hey|que tal|que onda|hola jef[ae])\b/.test(first)) {
    items.push({
      ok: false,
      id: 'INFORMAL_GREETING', t: issueLabel('INFORMAL_GREETING'),
      d: L(
        `Tu saludo es para un amigo, no para ${isBoss ? 'tu jefa' : 'un cliente'}. En el trabajo usa uno más formal, como ${isBoss ? '“Estimada Laura:” o “Buenos días, Laura:”' : '“Estimado Carlos:” o “Buenos días, Sr. Rivera:”'}.`,
        `Your greeting is for a friend, not for ${isBoss ? 'your manager' : 'a client'}. At work use a more formal one, like ${isBoss ? '“Dear Laura,” or “Good morning, Laura,”' : '“Dear Carlos,” or “Good morning, Mr. Rivera,”'}.`,
      ),
    });
  } else {
    items.push({
      ok: true,
      t: L('Saludo', 'Greeting'),
      d: formal && /^\s*(estimad|buen|dear|good)/.test(first)
        ? L('Empezaste con un saludo formal, perfecto para un correo de trabajo.', 'You started with a formal greeting, perfect for a work email.')
        : L('Empezaste con un saludo. Es una forma amable de comenzar.', 'You started with a greeting. It is a friendly way to begin.'),
    });
  }

  if (isSofia) {
    const found = findAnswer(fixed);
    const answer = found && 'answer' in found ? found : null;
    const unsure = found && 'unsure' in found ? found.unsure : '';
    const negative = Boolean(answer && answer.negative);
    const topic = TOPIC_RE.test(lower);
    req.answer = Boolean(answer);
    const said = answer ? esc(answer.answer) : '';
    const futureNote = answer && answer.future ? L(' Usaste un verbo en futuro, ideal para hablar de lo que vas a hacer.', ' You used the future tense, ideal for talking about what you will do.') : '';
    const example = negative ? L('“Lo siento, no podré ir a cenar el domingo.”', '“Sorry, I won’t be able to come for dinner on Sunday.”') : L('“Sí, estaré ahí el domingo.”', '“Yes, I will be there on Sunday.”');
    // An optional tip, never a blocker: the learner's keyboard may not have accents.
    const siNote = answer && answer.si ? L(' Si tu teclado lo permite, puedes escribir “sí” con tilde: así se distingue de “si” (if).', ' In Spanish, if your keyboard allows it, you can write “sí” with an accent: it tells “yes” apart from “si” (if).') : '';
    const notes = `${futureNote}${siNote}`;

    items.push(!answer
      ? {
        ok: false,
        id: 'NO_ANSWER', t: issueLabel('NO_ANSWER'),
        d: unsure
          ? L(`Tu respuesta no deja claro si vas a ir (“${esc(unsure)}”). Sofía necesita saberlo para preparar la cena. Di sí o no, por ejemplo: “¡Sí, estaré ahí el domingo!” o “Lo siento, no podré ir el domingo.”`, `Your reply does not make clear whether you will go (“${esc(unsure)}”). Sofía needs to know so she can plan the dinner. Say yes or no, for example: “Yes, I will be there on Sunday!” or “Sorry, I can’t come on Sunday.”`)
          : L('Sofía te preguntó si quieres ir a cenar el domingo, pero tu correo no dice si vas a ir. Escríbelo claramente, por ejemplo: “¡Sí, estaré ahí el domingo!” o “Lo siento, no podré ir el domingo.”', 'Sofía asked if you want to come for dinner on Sunday, but your email does not say whether you will go. Say it clearly, for example: “Yes, I will be there on Sunday!” or “Sorry, I can’t come on Sunday.”'),
      }
      : topic
        ? { ok: true, t: L('Respuesta a su pregunta', 'Answer to her question'), d: L(`Contestaste su pregunta sobre la cena del domingo (“${said}”).${notes} Así Sofía sabe qué esperar.`, `You answered her question about Sunday dinner (“${said}”).${notes} Now Sofía knows what to expect.`) }
        : { ok: true, t: L('Respuesta a su pregunta', 'Answer to her question'), d: L(`Contestaste su pregunta (“${said}”).${notes} Para que quede aún más claro, menciona la cena o el domingo, por ejemplo: ${example}`, `You answered her question (“${said}”).${notes} To make it even clearer, mention the dinner or Sunday, for example: ${example}`) });
  }

  if (isBoss) {
    const dayOff = lower.match(DAYOFF_RE);
    const date = lower.match(DATE_RE);
    const polite = lower.match(POLITE_RE);
    const reason = lower.match(REASON_RE);
    req.request = Boolean(dayOff);
    req.date = Boolean(date);

    items.push(dayOff
      ? { ok: true, t: L('Tu petición', 'Your request'), d: L(`Dijiste claramente lo que pides (“${quote(dayOff)}”).`, `You said clearly what you are asking for (“${quote(dayOff)}”).`) }
      : { ok: false, id: 'NO_REQUEST', t: issueLabel('NO_REQUEST'), d: L('Tu correo no dice que quieres un día libre. Escríbelo claramente, por ejemplo: “Quisiera pedirle el viernes libre.”', 'Your email does not say you want a day off. Say it clearly, for example: “I would like to ask for Friday off.”') });

    items.push(date
      ? { ok: true, t: L('El día', 'The day'), d: L(`Dijiste qué día necesitas (“${quote(date)}”). Así tu jefa puede organizar el trabajo.`, `You said which day you need (“${quote(date)}”). Now your manager can plan the work.`) }
      : { ok: false, id: 'NO_DATE', t: issueLabel('NO_DATE'), d: L('No dices qué día necesitas libre. Escribe el día o la fecha, por ejemplo: “el viernes 24 de octubre”.', 'You do not say which day you need off. Write the day or the date, for example: “Friday, October 24”.') });

    items.push(polite
      ? { ok: true, t: L('Cortesía', 'Politeness'), d: L(`Lo pediste con amabilidad (“${quote(polite)}”). Con un jefe, pedir en vez de avisar causa una buena impresión.`, `You asked kindly (“${quote(polite)}”). With a manager, asking instead of announcing makes a good impression.`) }
      : { ok: false, id: 'NOT_POLITE', t: issueLabel('NOT_POLITE'), d: L('Tu correo suena a aviso, no a petición. Usa una forma amable, como “¿Sería posible…?”, “Quisiera pedirle…” o “Le agradecería…”.', 'Your email sounds like an announcement, not a request. Use a polite form, like “Would it be possible…?”, “I would like to ask…” or “I would appreciate…”.') });

    items.push(reason
      ? { ok: true, t: L('El motivo', 'The reason'), d: L('Explicaste por qué necesitas el día. Eso ayuda a tu jefa a entender tu petición.', 'You explained why you need the day. That helps your manager understand your request.') }
      : { ok: false, id: 'NO_REASON', t: issueLabel('NO_REASON'), d: L('Es buena idea explicar brevemente por qué lo necesitas, por ejemplo: “porque tengo una cita médica”. No hace falta dar detalles privados.', 'It is a good idea to briefly explain why you need it, for example: “because I have a doctor’s appointment”. You do not need to share private details.') });
  }

  if (isClient) {
    const invoice = lower.match(/\b(factura|invoice|bill)\b/);
    const number = /\b1045\b/.test(lower);
    const attachment = lower.match(ATT_MENTION_RE);
    req.invoice = Boolean(invoice);
    req.attMention = Boolean(attachment);

    items.push(!invoice
      ? { ok: false, id: 'NO_INVOICE_MENTION', t: issueLabel('NO_INVOICE_MENTION'), d: L('Tu mensaje no dice qué le envías al cliente. Escríbelo, por ejemplo: “Le envío la factura n.º 1045.”', 'Your message does not say what you are sending the client. Say it, for example: “Please find invoice #1045 attached.”') }
      : number
        ? { ok: true, t: L('La factura', 'The invoice'), d: L('Dijiste de qué factura se trata (n.º 1045). Así el cliente sabe exactamente qué recibe.', 'You said which invoice it is (#1045). Now the client knows exactly what they are getting.') }
        : { ok: false, id: 'NO_INVOICE_NUMBER', t: issueLabel('NO_INVOICE_NUMBER'), d: L('Mencionaste la factura, pero no su número. Agrega “n.º 1045” para que el cliente sepa cuál es.', 'You mentioned the invoice, but not its number. Add “#1045” so the client knows which one it is.') });

    items.push(attachment
      ? { ok: true, t: L('Avisas del adjunto', 'You mention the attachment'), d: L(`Le dijiste al cliente que va un archivo adjunto (“${quote(attachment)}”).`, `You told the client a file is attached (“${quote(attachment)}”).`) }
      : { ok: false, id: 'NO_ATTACHMENT_MENTION', t: issueLabel('NO_ATTACHMENT_MENTION'), d: L('Escribe una frase que diga que el archivo va adjunto, por ejemplo: “Le adjunto la factura n.º 1045.” Así el cliente sabe que debe abrirlo.', 'Write a sentence saying the file is attached, for example: “I have attached invoice #1045.” Then the client knows to open it.') });
  }

  const informal = formal && hasBye && INFORMAL_BYE_RE.test(fold(tail));
  const byeExample = formal ? L('“Saludos cordiales,” o “Atentamente,”', '“Kind regards,” or “Sincerely,”') : L('“Un abrazo,” o “Gracias,”', '“Hugs,” or “Thanks,”');

  items.push(!hasBye
    ? {
      ok: false,
      id: 'NO_GOODBYE', t: issueLabel('NO_GOODBYE'),
      d: byeAnywhere
        ? L(`Usaste palabras amables, pero tu correo no termina con una despedida. Agrega una línea al final, como ${byeExample}, y debajo tu nombre.`, `You used kind words, but your email does not end with a closing. Add a line at the end, like ${byeExample}, and your name below it.`)
        : L(`Tu correo no tiene una línea de despedida. Al final escribe una, como ${byeExample}, y debajo tu nombre.`, `Your email has no closing line. At the end write one, like ${byeExample}, and your name below it.`),
    }
    : informal
      ? { ok: false, id: 'INFORMAL_GOODBYE', t: issueLabel('INFORMAL_GOODBYE'), d: L('“Besos” o “Un abrazo” son para amigos y familia. En un correo de trabajo usa “Saludos cordiales,” o “Atentamente,”, y debajo tu nombre.', '“Kisses” or “Hugs” are for friends and family. In a work email use “Kind regards,” or “Sincerely,”, and your name below it.') }
      : {
        ok: true,
        t: L('Despedida', 'Closing'),
        d: !byeWords
          ? L(
            `Cerraste firmando con tu nombre (“${esc(lastLine)}”).${formal ? ' En el trabajo también puedes agregar “Saludos cordiales,” antes de tu nombre.' : ' Si quieres, puedes agregar antes una despedida como “Un abrazo,”.'}`,
            `You ended by signing your name (“${esc(lastLine)}”).${formal ? ' At work you can also add “Kind regards,” before your name.' : ' If you like, you can add a closing like “Hugs,” before it.'}`,
          )
          : formal
            ? L('Cerraste con una despedida adecuada para el trabajo.', 'You ended with a closing that suits work.')
            : L('Cerraste con una despedida. Eso hace el mensaje más cortés.', 'You ended with a closing. That makes the message more polite.'),
      });

  const runOns = findRunOns(own);
  items.push(runOns.length
    ? {
      ok: false,
      id: 'RUN_ON_SENTENCE', t: issueLabel('RUN_ON_SENTENCE'),
      d: L(
        `${runOns.length === 1 ? 'Esta oración sigue y sigue' : 'Algunas oraciones siguen y siguen'} sin un punto: ${runOns.slice(0, 2).map((runOn) => `“${esc(runOn.start)}…” (${runOn.n} palabras)`).join(', ')}. Cuando termines una idea, pon un punto (.) y empieza la siguiente oración con mayúscula. Así es más fácil de leer.`,
        `${runOns.length === 1 ? 'This sentence goes on and on' : 'Some sentences go on and on'} without a full stop: ${runOns.slice(0, 2).map((runOn) => `“${esc(runOn.start)}…” (${runOn.n} words)`).join(', ')}. When you finish an idea, add a full stop (.) and start the next sentence with a capital letter. It is easier to read.`,
      ),
    }
    : { ok: true, t: L('Oraciones', 'Sentences'), d: L('Tus oraciones tienen un buen largo y se leen con facilidad.', 'Your sentences are a good length and easy to read.') });

  items.push(glued.length
    ? {
      ok: false,
      id: 'GLUED_WORDS', t: issueLabel('GLUED_WORDS'),
      d: `${L('Parece que algunas palabras quedaron pegadas:', 'Some words seem stuck together:')} ${glued.map((item) => `<span class="fb-fix"><s>${esc(item.bad)}</s> → <b>${esc(item.fix)}</b></span>`).join(' ')} ${L('Pon un espacio entre cada palabra, y también después de cada coma o punto.', 'Put a space between words, and also after every comma or full stop.')}`,
    }
    : { ok: true, t: L('Espacios', 'Spaces'), d: L('Separaste bien las palabras.', 'You separated the words well.') });

  return { items, req };
}

export { ATT_MENTION_RE, DATE_RE };
