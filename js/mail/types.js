/**
 * @typedef {'inbox'|'sent'|'spam'|'trash'} FolderId
 * @typedef {'new'|'reply'|'forward'} ComposeKind
 * @typedef {'to'|'sub'|'body'|'att'} CoachKey
 * @typedef {'sofia'|'boss'|'client'|''} MissionContext
 */

/**
 * @typedef {Object} MailMessage
 * @property {number} id
 * @property {string} from
 * @property {string} addr
 * @property {string} to
 * @property {string} subject
 * @property {string} date
 * @property {string} time
 * @property {string} body
 * @property {FolderId} folder
 * @property {boolean} unread
 * @property {boolean} starred
 * @property {boolean} [mine]
 * @property {boolean} [warn]
 * @property {{from: string|{es: string, en: string}, subject: string|{es: string, en: string}, body: string|{es: string, en: string}}} [i18n]  Both language versions of a practice email.
 * @property {string} [phishId]  Which fake email this is (see data/phishing.js).
 * @property {FolderId} [prev]
 * @property {string[]} [atts]
 */

/**
 * @typedef {HTMLElement & { _atts: string[] }} ComposeElement
 */

/**
 * @typedef {Object} ComposeDraft
 * @property {string} [title]
 * @property {string} [to]
 * @property {string} [subject]
 * @property {string} [body]
 * @property {'to'|'body'} [focus]
 * @property {ComposeKind} [kind]
 * @property {MissionContext} [mission]
 * @property {string[]} [atts]
 */

/**
 * @typedef {Object} MissionLogEntry
 * @property {number} tries
 * @property {Record<string, number>} issues
 * @property {Record<string, {n: number, cat: string, text?: string|{es: string, en: string}}>} helps
 * @property {string[]|null} last
 * @property {boolean} [early]
 * @property {number} [replays]  Times the learner chose to practise this step again.
 */

/**
 * @typedef {Object} MissionState
 * @property {number} step
 * @property {Set<number>} read
 * @property {Set<number>} deleted
 * @property {Set<number>} found  Step 3: warning signs of the fake email the learner has found (see data/phishing.js SIGN).
 * @property {boolean} done
 * @property {{step: number, returnTo: number, wasDone: boolean}|null} [replay]  Extra practice of a finished step.
 * @property {Record<number, MissionLogEntry>} log
 */

/**
 * @typedef {Object} MailState
 * @property {MailMessage[]} msgs
 * @property {string} folder
 * @property {number|null} open
 * @property {string} q
 * @property {Set<number>} sel
 * @property {{kind: string, ids: number[]}|null} ask
 * @property {(() => void)|null} undo
 * @property {number|null} toastTimer
 * @property {number} nextId
 * @property {string} addr
 * @property {MissionState} mission
 * @property {{id: number, phishDone: boolean, step: number}[]} mrQueue
 * @property {Set<number>} misreported
 * @property {ComposeDraft|null} retryDraft
 * @property {{id: number, phishDone: boolean, step: number}|null} mr
 * @property {{id: number, note: string, misses: number}|null} inspect  Step 3: the message under the email being inspected and the normal taps in a row. Not saved.
 * @property {boolean} findHint  Step 3: the learner asked for a hint to find the fake email. Not saved.
 */

/**
 * @typedef {Object} AnalysisItem
 * @property {boolean} ok
 * @property {boolean} [tip]  Advice that does not block the step.
 * @property {string} [id]  Issue id from ISSUES when this item is a problem.
 * @property {string} t
 * @property {string} d
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {AnalysisItem[]} items
 * @property {{greet: boolean, bye: boolean, answer: boolean, request: boolean, date: boolean, invoice: boolean, attMention: boolean}|null} req
 */

export {};
