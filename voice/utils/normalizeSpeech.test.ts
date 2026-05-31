import normalizeSpeech from './normalizeSpeech'
import lookup from './phoneticLookup.json'

// ─── Core behaviour ─────────────────────────────────────────────────────────

describe('normalizeSpeech — core', () => {
  it('substitutes a known word', () => expect(normalizeSpeech('ice', lookup)).toBe('A'))
  it('passes through an unknown word unchanged', () => expect(normalizeSpeech('hello', lookup)).toBe('hello'))
  it('empty string', () => expect(normalizeSpeech('', lookup)).toBe(''))
})

// ─── Case handling ───────────────────────────────────────────────────────────

describe('normalizeSpeech — case', () => {
  it('"ice" → A (lowercase key matches)', () => expect(normalizeSpeech('ice', lookup)).toBe('A'))
  it('"Ice" → A (lowercased to "ice" before lookup)', () => expect(normalizeSpeech('Ice', lookup)).toBe('A'))
  it('"ICE" → A (uppercased, lowercased before lookup)', () => expect(normalizeSpeech('ICE', lookup)).toBe('A'))
  // "China" → lookup key is "china", but only "China" (capital) exists in the JSON.
  // normalizeSpeech lowercases to "china" which does NOT match — returns original.
  it('"China" is NOT corrected (capital-only key, lowercasing misses it)', () =>
    expect(normalizeSpeech('China', lookup)).toBe('China'))
})

// ─── A / Ace corrections ────────────────────────────────────────────────────

describe('normalizeSpeech — A (ace) mishears', () => {
  for (const word of ['ice', 'nice', 'dice', 'face', 'base', 'piece', 'price', 'place', 'pics']) {
    it(`"${word}" → A`, () => expect(normalizeSpeech(word, lookup)).toBe('A'))
  }
  it('"ace" → A', () => expect(normalizeSpeech('ace', lookup)).toBe('A'))
  it('"aces" → A', () => expect(normalizeSpeech('aces', lookup)).toBe('A'))
})

// ─── Rank substitutions ─────────────────────────────────────────────────────

describe('normalizeSpeech — rank substitutions', () => {
  const cases: [string, string][] = [
    ['king', 'K'], ['kings', 'K'],
    ['queen', 'Q'], ['queens', 'Q'],
    ['jack', 'J'], ['jacks', 'J'],
    ['ten', 'T'], ['tens', 'T'], ['chain', 'T'],
    ['nine', '9'], ['nines', '9'],
    ['eight', '8'], ['eights', '8'],
    ['seven', '7'], ['sevens', '7'],
    ['six', '6'], ['sixes', '6'],
    ['five', '5'], ['fives', '5'],
    ['four', '4'], ['fours', '4'], ['force', '4'],
    ['three', '3'], ['threes', '3'], ['tree', '3'], ['trey', '3'],
    ['two', '2'], ['twos', '2'], ['deuce', '2'], ['deuces', '2'],
  ]
  for (const [input, expected] of cases) {
    it(`"${input}" → ${expected}`, () => expect(normalizeSpeech(input, lookup)).toBe(expected))
  }
})

// ─── Suit substitutions ─────────────────────────────────────────────────────

describe('normalizeSpeech — suit substitutions', () => {
  const cases: [string, string][] = [
    ['heart', 'hearts'], ['hearts', 'hearts'],
    ['diamond', 'diamonds'], ['diamonds', 'diamonds'],
    ['club', 'clubs'], ['clubs', 'clubs'], ['cups', 'clubs'],
    ['spade', 'spades'], ['spades', 'spades'],
    ['spice', 'spades'], ['spikes', 'spades'],
  ]
  for (const [input, expected] of cases) {
    it(`"${input}" → ${expected}`, () => expect(normalizeSpeech(input, lookup)).toBe(expected))
  }
})

// ─── Whitespace and punctuation preservation ─────────────────────────────────

describe('normalizeSpeech — multi-word phrases', () => {
  it('substitutes each word independently, preserves spaces', () =>
    expect(normalizeSpeech('hold the ice', lookup)).toBe('hold the A'))
  it('two substitutions in one phrase', () =>
    expect(normalizeSpeech('ice of hearts', lookup)).toBe('A of hearts'))
  it('punctuation tokens are passed through unchanged', () =>
    expect(normalizeSpeech('ice.', lookup)).toBe('A.'))
  it('preserves surrounding whitespace tokens', () =>
    expect(normalizeSpeech('hold  ice', lookup)).toBe('hold  A'))
})
