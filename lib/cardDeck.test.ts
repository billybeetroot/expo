import { getDeck, shuffleDeck, dealCards, getDispHand, sortBadHoldCards } from './cardDeck'

describe('getDeck', () => {
  it('returns 52 cards', () => {
    expect(getDeck()).toHaveLength(52)
  })

  it('all cards are unique', () => {
    const deck = getDeck()
    expect(new Set(deck).size).toBe(52)
  })

  it('each card is rank+suit (2 chars)', () => {
    getDeck().forEach((card) => expect(card).toHaveLength(2))
  })

  it('contains Ace of clubs', () => {
    expect(getDeck()).toContain('Ac')
  })

  it('contains King of spades', () => {
    expect(getDeck()).toContain('Ks')
  })

  it('contains Ten of hearts', () => {
    expect(getDeck()).toContain('Th')
  })
})

describe('shuffleDeck', () => {
  it('returns the same length', () => {
    const deck = getDeck()
    expect(shuffleDeck([...deck])).toHaveLength(52)
  })

  it('contains the same cards', () => {
    const deck = getDeck()
    const shuffled = shuffleDeck([...deck])
    expect(shuffled.sort()).toEqual(deck.sort())
  })
})

describe('dealCards', () => {
  it('deals the requested number of cards', () => {
    const deck = getDeck()
    expect(dealCards(deck, 5)).toHaveLength(5)
  })

  it('removes dealt cards from the deck', () => {
    const deck = getDeck()
    dealCards(deck, 5)
    expect(deck).toHaveLength(47)
  })

  it('returns valid 2-char card codes', () => {
    const deck = getDeck()
    const hand = dealCards(deck, 5)
    hand.forEach((card) => expect(card).toHaveLength(2))
  })
})

describe('getDispHand', () => {
  it('replaces c with ♣', () => {
    expect(getDispHand('Ac')).toContain('♣')
  })

  it('replaces d with ♦', () => {
    expect(getDispHand('Ad')).toContain('♦')
  })

  it('replaces h with ♥', () => {
    expect(getDispHand('Ah')).toContain('♥')
  })

  it('replaces s with ♠', () => {
    expect(getDispHand('As')).toContain('♠')
  })

  it('keeps rank characters unchanged', () => {
    expect(getDispHand('Ac')).toContain('A')
    expect(getDispHand('Tc')).toContain('T')
  })

  it('converts a full 5-card hand string', () => {
    expect(getDispHand('AcKdThJh2s')).toBe('A♣K♦T♥J♥2♠')
  })
})

describe('sortBadHoldCards', () => {
  it('sorts cards by rank ascending (2 lowest, A highest)', () => {
    const result = sortBadHoldCards('Kc Ac 2d')
    expect(result).toEqual(['2d', 'Kc', 'Ac'])
  })

  it('filters empty strings', () => {
    const result = sortBadHoldCards('Ac ')
    expect(result).not.toContain('')
  })

  it('handles single card', () => {
    expect(sortBadHoldCards('Qh')).toEqual(['Qh'])
  })
})
