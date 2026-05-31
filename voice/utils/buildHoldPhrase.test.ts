import { buildHoldPhrase } from './buildHoldPhrase'

const HAND = ['Ah', 'Ac', '2h', '5h', 'Kd'] // test plan hand

describe('buildHoldPhrase — edge positions', () => {
  it('no positions → "Hold nothing."', () =>
    expect(buildHoldPhrase(HAND, [])).toBe('Hold nothing.'))
  it('all 5 positions → "Hold all five cards."', () =>
    expect(buildHoldPhrase(HAND, [1, 2, 3, 4, 5])).toBe('Hold all five cards.'))
})

describe('buildHoldPhrase — single card', () => {
  it('position 1 (Ah)', () => expect(buildHoldPhrase(HAND, [1])).toBe('Hold the ace of hearts.'))
  it('position 2 (Ac)', () => expect(buildHoldPhrase(HAND, [2])).toBe('Hold the ace of clubs.'))
  it('position 3 (2h)', () => expect(buildHoldPhrase(HAND, [3])).toBe('Hold the two of hearts.'))
  it('position 4 (5h)', () => expect(buildHoldPhrase(HAND, [4])).toBe('Hold the five of hearts.'))
  it('position 5 (Kd)', () => expect(buildHoldPhrase(HAND, [5])).toBe('Hold the king of diamonds.'))
})

describe('buildHoldPhrase — two cards', () => {
  it('[1, 2] → "Hold the ace of hearts and the ace of clubs."', () =>
    expect(buildHoldPhrase(HAND, [1, 2])).toBe('Hold the ace of hearts and the ace of clubs.'))
  it('[1, 5] → "Hold the ace of hearts and the king of diamonds."', () =>
    expect(buildHoldPhrase(HAND, [1, 5])).toBe('Hold the ace of hearts and the king of diamonds.'))
})

describe('buildHoldPhrase — three cards', () => {
  it('[1, 2, 5]', () =>
    expect(buildHoldPhrase(HAND, [1, 2, 5])).toBe(
      'Hold the ace of hearts, the ace of clubs, and the king of diamonds.'
    ))
})

describe('buildHoldPhrase — four cards', () => {
  it('[1, 2, 3, 5]', () =>
    expect(buildHoldPhrase(HAND, [1, 2, 3, 5])).toBe(
      'Hold the ace of hearts, the ace of clubs, the two of hearts, and the king of diamonds.'
    ))
})

describe('buildHoldPhrase — sorting', () => {
  it('unordered positions are sorted before output', () =>
    expect(buildHoldPhrase(HAND, [5, 1])).toBe(
      'Hold the ace of hearts and the king of diamonds.'
    ))
})

describe('buildHoldPhrase — suit names', () => {
  const allSuits = ['Ah', 'Ad', 'Ac', 'As', 'Kh']
  it('hearts', () => expect(buildHoldPhrase(allSuits, [1])).toBe('Hold the ace of hearts.'))
  it('diamonds', () => expect(buildHoldPhrase(allSuits, [2])).toBe('Hold the ace of diamonds.'))
  it('clubs', () => expect(buildHoldPhrase(allSuits, [3])).toBe('Hold the ace of clubs.'))
  it('spades', () => expect(buildHoldPhrase(allSuits, [4])).toBe('Hold the ace of spades.'))
})

describe('buildHoldPhrase — rank names', () => {
  const rankHand = ['Th', 'Jh', 'Qh', 'Kh', 'Ah']
  it('ten', () => expect(buildHoldPhrase(rankHand, [1])).toBe('Hold the ten of hearts.'))
  it('jack', () => expect(buildHoldPhrase(rankHand, [2])).toBe('Hold the jack of hearts.'))
  it('queen', () => expect(buildHoldPhrase(rankHand, [3])).toBe('Hold the queen of hearts.'))
  it('king', () => expect(buildHoldPhrase(rankHand, [4])).toBe('Hold the king of hearts.'))
  it('ace', () => expect(buildHoldPhrase(rankHand, [5])).toBe('Hold the ace of hearts.'))
})
