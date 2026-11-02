/**
 * The seven practice steps, in order. Use these names instead of bare numbers
 * so the code says which step it means and steps can be reordered safely.
 */
export const STEP = Object.freeze({
  READ_NEW: 1,
  DELETE_OLD: 2,
  REPORT_PHISH: 3,
  REPLY_SOFIA: 4,
  ASK_DAY_OFF: 5,
  SEND_INVOICE: 6,
  SIGN_OUT: 7,
});

export const TOTAL_STEPS = 7;

/** [1, 2, …, TOTAL_STEPS] */
export const ALL_STEPS = Object.freeze(Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1));
