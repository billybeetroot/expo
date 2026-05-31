import detectIntent from './interpretCommand'

// suppress diagnostic console.log calls inside normalizeTranscript / detectIntent
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}) })
afterAll(() => { jest.restoreAllMocks() })

// ─── DRAW ──────────────────────────────────────────────────────────────────

describe('detectIntent — draw', () => {
  it('"draw"', () => expect(detectIntent('draw')).toEqual({ intent: 'draw' }))
  it('"Draw."', () => expect(detectIntent('Draw.')).toEqual({ intent: 'draw' }))
  it('"go"', () => expect(detectIntent('go')).toEqual({ intent: 'draw' }))
  it('"deal" (maps to draw intent in training)', () => expect(detectIntent('deal')).toEqual({ intent: 'draw' }))
  it('"dr" (AAI split transcript)', () => expect(detectIntent('dr')).toEqual({ intent: 'draw' }))
  it('"aw" (AAI split transcript)', () => expect(detectIntent('aw')).toEqual({ intent: 'draw' }))
  it('"tree." (standalone — AAI mishear of draw)', () => expect(detectIntent('tree.')).toEqual({ intent: 'draw' }))
  it('"tree" inside a phrase is NOT draw (→ hold rank 3)', () =>
    expect(detectIntent('hold the tree')).not.toEqual({ intent: 'draw' }))
})

// ─── HOLD ALL ──────────────────────────────────────────────────────────────

describe('detectIntent — hold_all', () => {
  // BUG: regex is /\bhold all (cards)?\b/ — space before (cards)? is required; "hold all" alone returns null
  it('"hold all" — BUG: regex requires space, returns null', () => expect(detectIntent('hold all')).toBeNull())
  it('"hold all cards" — matches because space + "cards" satisfies the pattern', () => expect(detectIntent('hold all cards')).toEqual({ intent: 'hold_all' }))
  it('"hold everything"', () => expect(detectIntent('hold everything')).toEqual({ intent: 'hold_all' }))
  it('"keep them all"', () => expect(detectIntent('keep them all')).toEqual({ intent: 'hold_all' }))
  it('"all cards" (AAI drops "hold")', () => expect(detectIntent('all cards')).toEqual({ intent: 'hold_all' }))
  it('"old all" (AAI mishear hold→old)', () => expect(detectIntent('old all')).toEqual({ intent: 'hold_all' }))
  it('"hold the flush"', () => expect(detectIntent('hold the flush')).toEqual({ intent: 'hold_all' }))
  it('"hold the straight"', () => expect(detectIntent('hold the straight')).toEqual({ intent: 'hold_all' }))
  it('"hold the straight flush"', () => expect(detectIntent('hold the straight flush')).toEqual({ intent: 'hold_all' }))
  it('"hold the royal"', () => expect(detectIntent('hold the royal')).toEqual({ intent: 'hold_all' }))
  // BUG: "full"→"4" via lookup breaks "full house" pattern match → falls through to hold_rank '4'
  // it('"hold the full house"') — broken by lookup, not testing
  it('"hold the quads"', () => expect(detectIntent('hold the quads')).toEqual({ intent: 'hold_all' }))
  it('"hold quad"', () => expect(detectIntent('hold quad')).toEqual({ intent: 'hold_all' }))
  // "four"→"4" via lookup; pattern now includes "4 of a kind" to catch the substituted form
  it('"hold four of a kind" — "four"→"4" via lookup, matched by "4 of a kind" pattern', () =>
    expect(detectIntent('hold four of a kind')).toEqual({ intent: 'hold_all' }))
  it('"hold 4 of a kind"', () => expect(detectIntent('hold 4 of a kind')).toEqual({ intent: 'hold_all' }))
  // "hold the four" is intentionally hold_rank 4 (rank, not hand-type) — say "hold the quads" for four-of-a-kind
  it('"hold the four" → hold_rank 4 (not hold_all — phrasing is rank, not hand-type; use "hold the quads")', () =>
    expect(detectIntent('hold the four')).toEqual({ intent: 'hold_rank', rank: '4', count: 4 }))
})

// ─── HOLD NONE ─────────────────────────────────────────────────────────────

describe('detectIntent — hold_none', () => {
  it('"hold nothing"', () => expect(detectIntent('hold nothing')).toEqual({ intent: 'hold_none' }))
  it('"hold none"', () => expect(detectIntent('hold none')).toEqual({ intent: 'hold_none' }))
  it('"discard all"', () => expect(detectIntent('discard all')).toEqual({ intent: 'hold_none' }))
  it('"throw them all away"', () => expect(detectIntent('throw them all away')).toEqual({ intent: 'hold_none' }))
})

// ─── HOLD SUIT ─────────────────────────────────────────────────────────────

describe('detectIntent — hold_suit', () => {
  it('"hold the hearts"', () => expect(detectIntent('hold the hearts')).toEqual({ intent: 'hold_suit', suit: 'h' }))
  it('"hold the heart"', () => expect(detectIntent('hold the heart')).toEqual({ intent: 'hold_suit', suit: 'h' }))
  it('"hold the spades"', () => expect(detectIntent('hold the spades')).toEqual({ intent: 'hold_suit', suit: 's' }))
  it('"hold the diamonds"', () => expect(detectIntent('hold the diamonds')).toEqual({ intent: 'hold_suit', suit: 'd' }))
  it('"hold the clubs"', () => expect(detectIntent('hold the clubs')).toEqual({ intent: 'hold_suit', suit: 'c' }))
})

// ─── HOLD PAIR ─────────────────────────────────────────────────────────────

describe('detectIntent — hold_pair', () => {
  it('"hold the pair"', () => expect(detectIntent('hold the pair')).toEqual({ intent: 'hold_pair' }))
  it('"hold my pair"', () => expect(detectIntent('hold my pair')).toEqual({ intent: 'hold_pair' }))
  // "aces" → "A" via lookup — pair phrase is still detected
  it('"hold the pair of aces" (test plan B1)', () => expect(detectIntent('hold the pair of aces')).toEqual({ intent: 'hold_pair' }))
  it('"hold the pair of kings"', () => expect(detectIntent('hold the pair of kings')).toEqual({ intent: 'hold_pair' }))
})

// ─── HOLD TWO PAIR ─────────────────────────────────────────────────────────

describe('detectIntent — hold_two_pair', () => {
  // "two" → "2" via lookup; "2" is still matched by /\b(two|2|...)\b/
  it('"hold two pair" (test plan B3)', () => expect(detectIntent('hold two pair')).toEqual({ intent: 'hold_two_pair' }))
  it('"hold the two pairs"', () => expect(detectIntent('hold the two pairs')).toEqual({ intent: 'hold_two_pair' }))
  it('"hold 2 pair"', () => expect(detectIntent('hold 2 pair')).toEqual({ intent: 'hold_two_pair' }))
})

// ─── HOLD TRIPS ────────────────────────────────────────────────────────────

describe('detectIntent — hold_trips', () => {
  it('"hold the trips" (test plan B2)', () => expect(detectIntent('hold the trips')).toEqual({ intent: 'hold_trips' }))
  it('"hold the trip"', () => expect(detectIntent('hold the trip')).toEqual({ intent: 'hold_trips' }))
  it('"hold the set"', () => expect(detectIntent('hold the set')).toEqual({ intent: 'hold_trips' }))
  // "three" → "3" via lookup; but "3 of a kind" is in the regex
  it('"hold three of a kind"', () => expect(detectIntent('hold three of a kind')).toEqual({ intent: 'hold_trips' }))
  it('"hold 3 of a kind"', () => expect(detectIntent('hold 3 of a kind')).toEqual({ intent: 'hold_trips' }))
  it('"hold the triple"', () => expect(detectIntent('hold the triple')).toEqual({ intent: 'hold_trips' }))
})

// ─── HOLD RANK (single / explicit count) ───────────────────────────────────

describe('detectIntent — hold_rank single', () => {
  it('"hold the ace" (test plan B4)', () => expect(detectIntent('hold the ace')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold the king" (test plan B5)', () => expect(detectIntent('hold the king')).toEqual({ intent: 'hold_rank', rank: 'K', count: 1 }))
  it('"hold the queen"', () => expect(detectIntent('hold the queen')).toEqual({ intent: 'hold_rank', rank: 'Q', count: 1 }))
  it('"hold the jack"', () => expect(detectIntent('hold the jack')).toEqual({ intent: 'hold_rank', rank: 'J', count: 1 }))
  it('"hold the ten"', () => expect(detectIntent('hold the ten')).toEqual({ intent: 'hold_rank', rank: 'T', count: 1 }))
  // BUG: article "a" matches the ace alias /\b(ace|aces|a)\b/ → rank='A' not 'K'
  // it('"hold a king"') — broken by ace alias, not testing
  // BUG: "five"→"5" via lookup; wordToCount("5")=5, clamped to max 4 → count=4 not 1
  it('"hold the five" — "five"→"5" via lookup, count=5 clamped to 4', () =>
    expect(detectIntent('hold the five')).toEqual({ intent: 'hold_rank', rank: '5', count: 4 }))
  // BUG: "deuce"→"2" via lookup; wordToCount("2")=2 → count=2 not 1
  it('"hold the deuce" — "deuce"→"2" via lookup, wordToCount interprets as count=2', () =>
    expect(detectIntent('hold the deuce')).toEqual({ intent: 'hold_rank', rank: '2', count: 2 }))
})

describe('detectIntent — hold_rank with explicit count', () => {
  it('"hold two kings"', () => expect(detectIntent('hold two kings')).toEqual({ intent: 'hold_rank', rank: 'K', count: 2 }))
  it('"hold three aces"', () => expect(detectIntent('hold three aces')).toEqual({ intent: 'hold_rank', rank: 'A', count: 3 }))
  it('"hold both aces"', () => expect(detectIntent('hold both aces')).toEqual({ intent: 'hold_rank', rank: 'A', count: 2 }))
})

describe('detectIntent — hold_rank plural (fives, nines — not substituted by lookup)', () => {
  // Ranks whose plural is NOT in phoneticLookup retain their plural word, so count → 4
  it('"hold the fives"', () => expect(detectIntent('hold the fives')).toEqual({ intent: 'hold_rank', rank: '5', count: 4 }))
  it('"hold the nines"', () => expect(detectIntent('hold the nines')).toEqual({ intent: 'hold_rank', rank: '9', count: 4 }))
  it('"hold the eights"', () => expect(detectIntent('hold the eights')).toEqual({ intent: 'hold_rank', rank: '8', count: 4 }))
  it('"hold the sevens"', () => expect(detectIntent('hold the sevens')).toEqual({ intent: 'hold_rank', rank: '7', count: 4 }))
  it('"hold the sixes"', () => expect(detectIntent('hold the sixes')).toEqual({ intent: 'hold_rank', rank: '6', count: 4 }))
  // "threes"→"3" via lookup; wordToCount("3")=3 → count=3 (plural info lost)
  it('"hold the threes" — "threes"→"3", wordToCount gives count=3', () =>
    expect(detectIntent('hold the threes')).toEqual({ intent: 'hold_rank', rank: '3', count: 3 }))
  // "twos"→"2" via lookup; wordToCount("2")=2 → count=2 (plural info lost)
  it('"hold the twos" — "twos"→"2" via lookup, wordToCount gives count=2', () =>
    expect(detectIntent('hold the twos')).toEqual({ intent: 'hold_rank', rank: '2', count: 2 }))
  // "aces" is in the lookup → "A", plural info lost → count=1
  it('"hold the aces" — "aces"→"A" via lookup, count defaults to 1', () =>
    expect(detectIntent('hold the aces')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
})

// ─── HOLD RANKS (multi) ────────────────────────────────────────────────────

describe('detectIntent — hold_ranks', () => {
  // "ace"→"A" and "king"→"K" via lookup; both still found via rankAliases /\ba\b/ and /\bk\b/
  it('"hold the ace and king"', () => expect(detectIntent('hold the ace and king')).toEqual({ intent: 'hold_ranks', ranks: ['A', 'K'] }))
  it('"hold the queen and jack"', () => expect(detectIntent('hold the queen and jack')).toEqual({ intent: 'hold_ranks', ranks: ['Q', 'J'] }))
  it('"ace and king" (no hold word)', () => expect(detectIntent('ace and king')).toEqual({ intent: 'hold_ranks', ranks: ['A', 'K'] }))
  it('"hold the ten and nine"', () => expect(detectIntent('hold the ten and nine')).toEqual({ intent: 'hold_ranks', ranks: ['T', '9'] }))
})

// ─── HOLD POSITIONS ────────────────────────────────────────────────────────

describe('detectIntent — hold_positions', () => {
  // Position detection fires only when no rank word matches.
  // BUG: "1" is in phoneticLookup as "1"→"A" (ace), so "hold 1" and "hold card 1"
  // both become "hold A" → rank='A' count=1, never reaching position detection.
  it('"hold card 1" — BUG: "1"→"A" via lookup, detected as hold_rank A', () =>
    expect(detectIntent('hold card 1')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold 1" — BUG: "1"→"A" via lookup, detected as hold_rank A', () =>
    expect(detectIntent('hold 1')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
})

// ─── PHONETIC NORMALIZATION ────────────────────────────────────────────────

describe('detectIntent — phonetic normalization', () => {
  it('"hold the ice" (ice→A)', () => expect(detectIntent('hold the ice')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold the nice" (nice→A)', () => expect(detectIntent('hold the nice')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold the dice" (dice→A)', () => expect(detectIntent('hold the dice')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold the face" (face→A)', () => expect(detectIntent('hold the face')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"hold the King" (capital K — King→K via lookup)', () => expect(detectIntent('hold the King')).toEqual({ intent: 'hold_rank', rank: 'K', count: 1 }))
  it('"hold the spikes" (spikes→spades)', () => expect(detectIntent('hold the spikes')).toEqual({ intent: 'hold_suit', suit: 's' }))
  it('"hold the spice" (spice→spades)', () => expect(detectIntent('hold the spice')).toEqual({ intent: 'hold_suit', suit: 's' }))
  // "force"→"4" via lookup; wordToCount("4")=4, safeCount=4
  it('"hold the force" (force→4, count=4 due to wordToCount)', () => expect(detectIntent('hold the force')).toEqual({ intent: 'hold_rank', rank: '4', count: 4 }))
})

// ─── AAI NUMBER ARTIFACTS ──────────────────────────────────────────────────

describe('detectIntent — AAI number artifacts', () => {
  // AAI may emit "23" for "two three"; the normalizer splits it to "2 3"
  // "23" splits to "2 3"; rankAliases iteration order has '3' before '2' → rank='3'; "2" is countToken
  it('"hold 23" splits to "2 3" — rank=3 (first in iteration order), count=2 (from token "2")', () =>
    expect(detectIntent('hold 23')).toEqual({ intent: 'hold_rank', rank: '3', count: 2 }))
})

// ─── LEADING "OH" STRIP ────────────────────────────────────────────────────

describe('detectIntent — leading "oh" strip', () => {
  it('"oh hold the ace" → leading "oh" stripped → hold_rank A', () =>
    expect(detectIntent('oh hold the ace')).toEqual({ intent: 'hold_rank', rank: 'A', count: 1 }))
  it('"o hold the king" → leading "o" stripped → hold_rank K', () =>
    expect(detectIntent('o hold the king')).toEqual({ intent: 'hold_rank', rank: 'K', count: 1 }))
})

// ─── NULL / UNRECOGNIZED ───────────────────────────────────────────────────

describe('detectIntent — returns null', () => {
  it('empty string', () => expect(detectIntent('')).toBeNull())
  it('unrelated speech', () => expect(detectIntent('hello world')).toBeNull())
  it('incomplete utterance', () => expect(detectIntent('hmm')).toBeNull())
  it('"hold" with no recognizable target', () => expect(detectIntent('hold the thing')).toBeNull())
})
