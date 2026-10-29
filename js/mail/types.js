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
 * @property {Record<string, {n: number, cat: string}>} helps
 * @property {string[]|null} last
 * @property {boolean} [early]
 */

/**
 * @typedef {Object} MissionState
 * @property {number} step
 * @property {Set<number>} read
 * @property {Set<number>} deleted
 * @property {boolean} done
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
 * @property {{id: number, phishDone: boolean}[]} mrQueue
 * @property {Set<number>} misreported
 * @property {ComposeDraft|null} retryDraft
 * @property {{id: number, phishDone: boolean}|null} mr
 */

/**
 * @typedef {Object} AnalysisItem
 * @property {boolean} ok
 * @property {string} t
 * @property {string} d
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {AnalysisItem[]} items
 * @property {{greet: boolean, bye: boolean, answer: boolean, request: boolean, date: boolean, invoice: boolean, attMention: boolean}|null} req
 */

export {};
