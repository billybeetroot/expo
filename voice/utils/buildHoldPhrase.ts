const RANK_NAMES: Record<string, string> = {
  A: 'ace',
  K: 'king',
  Q: 'queen',
  J: 'jack',
  T: 'ten',
  '9': 'nine',
  '8': 'eight',
  '7': 'seven',
  '6': 'six',
  '5': 'five',
  '4': 'four',
  '3': 'three',
  '2': 'two',
  W: 'wild',
}

const SUIT_NAMES: Record<string, string> = {
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
  s: 'spades',
}

function cardName(card: string): string {
  const rank = card[0]
  const suit = card[1]
  const r = RANK_NAMES[rank] ?? rank
  const s = SUIT_NAMES[suit] ?? suit
  return `${r} of ${s}`
}

/**
 * Builds a natural-language TTS phrase describing which cards to hold.
 *
 * @param hand - 5-element array of 2-char card codes, e.g. ['Ah','Ac','2h','5h','Kd']
 * @param holdPositions - 1-based positions to hold, e.g. [1, 2]
 */
export function buildHoldPhrase(hand: string[], holdPositions: number[]): string {
  const positions = [...holdPositions].sort((a, b) => a - b)

  if (positions.length === 0) return 'Hold nothing.'
  if (positions.length === 5) return 'Hold all five cards.'

  const cards = positions
    .map((p) => hand[p - 1])
    .filter(Boolean)
    .map(cardName)

  if (cards.length === 1) return `Hold the ${cards[0]}.`
  if (cards.length === 2) return `Hold the ${cards[0]} and the ${cards[1]}.`

  const last = cards[cards.length - 1]
  const rest = cards.slice(0, -1).join(', the ')
  return `Hold the ${rest}, and the ${last}.`
}
