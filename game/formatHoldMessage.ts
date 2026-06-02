import { selectHoldOutcome, HoldOutcome } from '@/lib/gamblerAlert'

export function formatHoldMessage(
  helpLineMessage: string,
  gamblerAlert: string | null,
  payValue: number,
  evs: string[][],
  hand: string[],
  isDeuces: boolean
): string {
  let msg = helpLineMessage

  // Equal-EV check applies when message involves a hold decision
  if (
    (msg.includes('CORRECT HOLD') || msg.includes('should hold:')) &&
    evs.length >= 2 &&
    evs[0]?.[0] === evs[1]?.[0]
  ) {
    // Extract ranks from hand (every other char from the joined hand string)
    const handStr = hand.join('')
    const ranks: string[] = []
    for (let i = 0; i < handStr.length; i += 2) ranks.push(handStr[i]!)

    // Find duplicate ranks (pairs)
    const pairs: string[] = []
    const seen: string[] = []
    for (const r of ranks) {
      if (seen.includes(r)) { if (!pairs.includes(r)) pairs.push(r) }
      else seen.push(r)
    }

    if (pairs.length === 2) {
      return `CORRECT HOLD. COULD HOLD EITHER PAIR: ${pairs[0]}s OR ${pairs[1]}s.`
    }

    // 4-to-a-straight edge case: 9-J-Q-K-A
    const rankStr = ranks.join('')
    if (rankStr === '9JQKA') {
      const type = isDeuces ? 'WILD INSIDE STRAIGHT' : 'INSIDE STRAIGHT'
      return `CORRECT HOLD. COULD HOLD EITHER 4 TO A ${type}: ${rankStr}. EITHER WITH THE ACE OR WITH THE 9 AND ONE GAP.`
    }
  }

  if (msg.includes('CORRECT HOLD')) {
    if (payValue > 0) {
      // "CORRECT HOLD." → "CORRECT HOLD - WIN!" (strip period, insert suffix)
      return msg.slice(0, 12) + ' - WIN!'
    }
    return msg
  }

  if (msg.includes('should hold:')) {
    const outcome: HoldOutcome = selectHoldOutcome(gamblerAlert, payValue)
    if (outcome === 'CORRECT HOLD.' && payValue > 0) return 'CORRECT HOLD - WIN!'
    return outcome
  }

  return msg
}
