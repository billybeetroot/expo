export type GamblerAlertEffect =
  | { kind: 'none' }
  | { kind: 'suppress_bad_hold' }
  | { kind: 'show_alert'; message: string }

/**
 * Maps the raw gamblerAlert string from the backend to a typed UI action.
 *   ""  / null / undefined  → none (do nothing)
 *   "EQUAL_EV"              → suppress_bad_hold (player held an equal-EV alternative)
 *   anything else           → show_alert (display the string as a pop-up message)
 */
export function interpretGamblerAlert(
  value: string | undefined | null
): GamblerAlertEffect {
  if (!value || value.length === 0) return { kind: 'none' }
  if (value === 'EQUAL_EV') return { kind: 'suppress_bad_hold' }
  return { kind: 'show_alert', message: value }
}

export type HoldOutcome = 'CORRECT HOLD.' | 'SUCCESSFUL HOLD.' | 'BAD HOLD'

/**
 * Selects the hold-result title suffix shown in the draw-handler alert.
 * EQUAL_EV takes priority over payValue — the player held correctly.
 */
export function selectHoldOutcome(
  gamblerAlert: string | undefined | null,
  payValue: number
): HoldOutcome {
  if (interpretGamblerAlert(gamblerAlert).kind === 'suppress_bad_hold')
    return 'CORRECT HOLD.'
  if (payValue) return 'SUCCESSFUL HOLD.'
  return 'BAD HOLD'
}
