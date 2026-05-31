import phoneticLookup from '@/voice/utils/phoneticLookup.json'
import normalizeSpeech from '@/voice/utils/normalizeSpeech'

type HoldRank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'

type HoldSuit = 's' | 'h' | 'd' | 'c'

type VoiceIntent =
  | { intent: 'hold_all' }
  | { intent: 'hold_none' }
  | { intent: 'hold_pair' }
  | { intent: 'hold_two_pair' }
  | { intent: 'hold_trips' }
  | { intent: 'hold_rank'; rank: HoldRank; count: number }
  | { intent: 'hold_ranks'; ranks: HoldRank[] }
  | { intent: 'hold_suit'; suit: HoldSuit }
  | { intent: 'hold_positions'; positions: number[] }
  | { intent: 'draw' }

const normalizeTranscript = (transcript: string) => {
  console.log('[normalizeTranscript] called with:', transcript)

  // apply phonetic corrections first (ice → ace, etc)
  const normalized = normalizeSpeech(transcript, phoneticLookup)

  const t = normalized
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    // AAI may format "two three" as the number "23"; split multi-digit tokens
    // composed entirely of card rank digits into separate rank characters
    // ("23" → "2 3", "234" → "2 3 4"). "10" is left intact (maps to T).
    .replace(/\b([2-9]{2,})\b/g, (m) => m.split('').join(' '))
    .replace(/\s+/g, ' ')
    .trim()

  console.log('[normalizeTranscript] out:', t)

  return t.replace(/^(o|oh)\s+/, '')
}

const wordToCount = (w: string) => {
  if (/^\d+$/.test(w)) return parseInt(w, 10)
  if (w === 'one') return 1
  if (w === 'two') return 2
  if (w === 'three') return 3
  if (w === 'four') return 4
  if (w === 'both') return 2
  if (w === 'all') return 4
  return null
}

const rankAliases: Array<[HoldRank, RegExp]> = [
  ['A', /\b(ace|aces|a)\b/],
  ['K', /\b(king|kings|k)\b/],
  ['Q', /\b(queen|queens|q)\b/],
  ['J', /\b(jack|jacks|j)\b/],
  ['T', /\b(ten|tens|10|t)\b/],
  ['9', /\b(nine|nines|9)\b/],
  ['8', /\b(eight|eights|8)\b/],
  ['7', /\b(seven|sevens|7)\b/],
  ['6', /\b(six|sixes|6)\b/],
  ['5', /\b(five|fives|5)\b/],
  ['4', /\b(four|fours|4)\b/],
  ['3', /\b(three|threes|3)\b/],
  ['2', /\b(two|twos|deuce|deuces|2)\b/],
]

const extractRanks = (t: string): HoldRank[] => {
  const found: HoldRank[] = []
  for (const [r, rx] of rankAliases) {
    if (rx.test(t)) found.push(r)
  }
  // de-dupe while preserving order
  return Array.from(new Set(found))
}

const detectSuit = (t: string): HoldSuit | null => {
  if (/\bspade(s)?\b/.test(t)) return 's'
  if (/\bheart(s)?\b/.test(t)) return 'h'
  if (/\bdiamond(s)?\b/.test(t)) return 'd'
  if (/\bclub(s)?\b/.test(t)) return 'c'

  return null
}

const detectHoldRank = (
  t: string
): { rank: HoldRank; count: number } | null => {
  // accept:
  // - "hold two kings"
  // - "two kings"
  // - "hold kings"
  // - "pair of kings"
  // - "hold a king" (count=1)
  //
  // rule: count defaults to 2 if phrase contains "pair", else defaults to 1 when count missing

  // If user is talking about "pairs", that's a hand-type concept, not a rank command.
  if (/\bpair(s)?\b/.test(t)) return null

  let rank: HoldRank | null = null
  for (const [r, rx] of rankAliases) {
    if (rx.test(t)) {
      rank = r
      break
    }
  }
  if (!rank) return null

  const tokens = t.split(' ')
  const countToken = tokens.find((w) => wordToCount(w) !== null)
  const countFromToken = countToken ? wordToCount(countToken) : null

  // If rank word is plural ("queens", "deuces", etc) and no explicit count was provided,
  // interpret as "all of that rank".
  const isPluralRankWord =
    /\b(aces|kings|queens|jacks|tens|nines|eights|sevens|sixes|fives|fours|threes|twos|deuces)\b/.test(
      t
    )

  const count = countFromToken ?? (isPluralRankWord ? 4 : 1)

  // clamp to 1-4 to avoid weird outputs
  const safeCount = Math.max(1, Math.min(4, count))

  return { rank, count: safeCount }
}

const detectIntent = (transcript: string): VoiceIntent | null => {
  const t = normalizeTranscript(transcript)
  console.log('detectIntent transcript: ', transcript, 'normalized:', t)

  if (/\b(draw|dr|aw|deal|go)\b/.test(t)) return { intent: 'draw' }
  // "tree" alone is a known AAI mishear of "draw"; check raw transcript so the
  // phonetic lookup (tree→3) doesn't obscure it. "hold the tree" is not affected
  // since that phrase contains more than just "tree".
  if (/^\s*tree\s*[.,!?]*\s*$/i.test(transcript)) return { intent: 'draw' }

  if (
    /\bhold all (cards)?\b/.test(t) ||
    /\bold all( cards)?\b/.test(t) ||   // AAI mishear: "hold" → "old"
    /\bhold everything\b/.test(t) ||
    /\bkeep them all\b/.test(t) ||
    /^all( cards)?$/.test(t)             // AAI drops "hold" entirely
  ) {
    return { intent: 'hold_all' }
  }

  if (
    /\bhold nothing\b/.test(t) ||
    /\bhold none\b/.test(t) ||
    /\bdiscard all\b/.test(t) ||
    /\bthrow (them )?all away\b/.test(t)
  ) {
    return { intent: 'hold_none' }
  }

  // HOLD SUIT: “hold the spades” => hold all spades in the hand
  const suit = detectSuit(t)
  if (suit) return { intent: 'hold_suit', suit }

  // HOLD MADE HAND: complete hands → hold all 5 cards
  if (/\bhold\b/.test(t)) {
    if (/\b(straight flush|royal)\b/.test(t)) return { intent: 'hold_all' }
    if (/\bstraight\b/.test(t)) return { intent: 'hold_all' }
    if (/\bflush\b/.test(t)) return { intent: 'hold_all' }
    if (/\bfull house\b/.test(t)) return { intent: 'hold_all' }
    if (/\b(quads?|four of a kind|4 of a kind)\b/.test(t)) return { intent: 'hold_all' }
  }

  // HOLD HAND TYPE: partial holds — find matching cards in hand at apply time
  if (/\b(trips?|triple|set|three of a kind|3 of a kind)\b/.test(t) && /\bhold\b/.test(t)) {
    return { intent: 'hold_trips' }
  }

  // Pair handling — BEFORE rank parsing so “pair” isn't misread as a rank
  if (/\b(pairs?)\b/.test(t)) {
    // “two pairs” / “the two pairs” (accept misheard “three pairs” too)
    if (/\b(two|2|three|3)\b/.test(t)) {
      return { intent: 'hold_two_pair' }
    }
    // plain “hold the pair” / “hold my pair”
    if (/\bhold\b/.test(t)) {
      return { intent: 'hold_pair' }
    }
  }

  // multi-rank “queen and jack”
  const ranks = extractRanks(t)
  if (ranks.length >= 2 && /\band\b/.test(t)) {
    return { intent: 'hold_ranks', ranks }
  }

  // single rank — run BEFORE position detection so that rank words normalized
  // to digits (e.g. “fives” → “5”) aren't misidentified as card positions
  const holdRank = detectHoldRank(t)
  if (holdRank) return { intent: 'hold_rank', ...holdRank }

  // HOLD POSITIONS: “hold 2 3 4” => card slots 2,3,4 (1-based)
  // Only reached if no rank matched above, so digits here are genuinely positions
  const posMatches = t.match(/\b[1-5]\b/g)
  if (/\bhold\b/.test(t) && posMatches && posMatches.length >= 1) {
    const positions = Array.from(
      new Set(posMatches.map((x) => Number(x)))
    ).sort((a, b) => a - b)
    return { intent: 'hold_positions', positions }
  }

  return null
}

export type { VoiceIntent, HoldRank }
export default detectIntent
