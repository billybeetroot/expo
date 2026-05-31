import ParseInputHand from './parseInputHand'

const noop = jest.fn()

describe('ParseInputHand — basic entry', () => {
  it('builds a single card from rank then suit', () => {
    const { noSpacesHand } = ParseInputHand('keyboard', 'c', 'A', noop)
    expect(noSpacesHand).toBe('Ac')
  })

  it('normalizes suit-before-rank to rank-first', () => {
    // user typed suit 'c' first, then rank 'A'
    const { noSpacesHand } = ParseInputHand('keyboard', 'A', 'c', noop)
    expect(noSpacesHand).toBe('Ac')
  })

  it('builds a dispHand with suit glyphs', () => {
    const { dispHand } = ParseInputHand('keyboard', 'c', 'A', noop)
    expect(dispHand).toContain('A')
    expect(dispHand).toContain('♣')
  })

  it('accumulates multiple cards', () => {
    const { noSpacesHand } = ParseInputHand('keyboard', 's', 'AcKd', noop)
    // AcKds is odd — stored as-is until next char completes Ks
    expect(noSpacesHand).toBe('AcKds')
  })
})

describe('ParseInputHand — 5-card cap', () => {
  it('ignores input beyond 10 chars (5 cards)', () => {
    const full = 'AcKdThJh2s'
    const { noSpacesHand } = ParseInputHand('keyboard', 'A', full, noop)
    expect(noSpacesHand).toBe(full)
  })

  it('still allows BS when full', () => {
    const full = 'AcKdThJh2s'
    const { noSpacesHand } = ParseInputHand('keyboard', 'BS', full, noop)
    // keyboard BS removes 1 char
    expect(noSpacesHand).toHaveLength(9)
  })
})

describe('ParseInputHand — backspace', () => {
  it('keyboard BS removes 1 char', () => {
    const { noSpacesHand } = ParseInputHand('keyboard', 'BS', 'Ac', noop)
    expect(noSpacesHand).toBe('A')
  })

  it('voice BS removes 2 chars (one full card)', () => {
    const { noSpacesHand } = ParseInputHand('voice', 'BS', 'AcKd', noop)
    expect(noSpacesHand).toBe('Ac')
  })

  it('keyboard BS on empty string returns empty', () => {
    const { noSpacesHand } = ParseInputHand('keyboard', 'BS', '', noop)
    expect(noSpacesHand).toBe('')
  })
})

describe('ParseInputHand — deduplication', () => {
  it('removes duplicate cards', () => {
    // enteredValue already has 'Ac'; adding 'c' to 'AcA' would create second Ac
    const { noSpacesHand } = ParseInputHand('keyboard', 'c', 'AcA', noop)
    // Should have only one 'Ac'
    const count = (noSpacesHand.match(/Ac/g) || []).length
    expect(count).toBe(1)
  })
})

describe('ParseInputHand — invalid pairs filtered', () => {
  it('filters out rank+rank pairs (no suit)', () => {
    // 'AK' = length 2 (even) → filter runs: 'K' is not a suit → dropped
    const { noSpacesHand } = ParseInputHand('keyboard', 'K', 'A', noop)
    expect(noSpacesHand).toBe('')
  })

  it('keeps valid rank+suit pair', () => {
    const { noSpacesHand } = ParseInputHand('keyboard', 'c', 'A', noop)
    expect(noSpacesHand).toBe('Ac')
  })
})

describe('ParseInputHand — dispHand padding', () => {
  it('pads dispHand to length 10 with spaces', () => {
    const { dispHand } = ParseInputHand('keyboard', 'c', 'A', noop)
    // 'Ac' → 2 chars displayed + 8 spaces of padding
    expect(dispHand).toHaveLength(10)
  })
})
