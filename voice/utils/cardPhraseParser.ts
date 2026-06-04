// Parses a spoken phrase into a card token (e.g. "ace of clubs" → "Ac")
// or a command string ("deal", "reset", "backspace"), or null.

const RANK_MAP: Record<string, string> = {
  ace: 'A', a: 'A',
  two: '2', '2': '2',
  three: '3', '3': '3',
  four: '4', '4': '4',
  five: '5', '5': '5',
  six: '6', '6': '6',
  seven: '7', '7': '7',
  eight: '8', '8': '8',
  nine: '9', '9': '9',
  ten: 'T', '10': 'T',
  jack: 'J', j: 'J',
  queen: 'Q', q: 'Q',
  king: 'K', k: 'K',
}

const SUIT_MAP: Record<string, string> = {
  club: 'c', clubs: 'c', c: 'c',
  diamond: 'd', diamonds: 'd', d: 'd',
  heart: 'h', hearts: 'h', h: 'h',
  spade: 's', spades: 's', s: 's',
}

const CARD_RE =
  /\b(ace|a|10|ten|[2-9]|two|three|four|five|six|seven|eight|nine|jack|j|queen|q|king|k)\s*(?:of\s*)?(clubs?|diamonds?|hearts?|spades?)\b/i

export type ParsedCard = { type: 'card'; token: string }
export type ParsedCommand = { type: 'command'; name: 'deal' | 'reset' | 'backspace' }
export type ParsedPhrase = ParsedCard | ParsedCommand | { type: 'none' }

export function parseCardPhrase(text: string): ParsedPhrase {
  const t = text
    .toLowerCase()
    .replace(/\bblack\s*space\b/g, 'backspace')
    .replace(/\bback\s*space\b/g, 'backspace')
    .replace(/\bfeel\b/g, 'deal')
    .replace(/\bjill\b/g, 'deal')

  // Commands take priority over card phrases
  const iDeal = t.lastIndexOf('deal')
  const iReset = t.lastIndexOf('reset')
  const iBack = t.lastIndexOf('backspace')
  const maxCmd = Math.max(iDeal, iReset, iBack)
  if (maxCmd >= 0) {
    const name = maxCmd === iBack ? 'backspace' : maxCmd === iReset ? 'reset' : 'deal'
    return { type: 'command', name }
  }

  const m = t.match(CARD_RE)
  if (m) {
    const rankKey = m[1]!.toLowerCase()
    const suitKey = m[2]!.toLowerCase().replace(/s$/, '') // strip trailing plural 's'
    const rank = RANK_MAP[rankKey]
    const suit = SUIT_MAP[suitKey] ?? SUIT_MAP[m[2]![0]!.toLowerCase()]
    if (rank && suit) return { type: 'card', token: rank + suit }
  }

  return { type: 'none' }
}
