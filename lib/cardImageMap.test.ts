import cardImageMap from './cardImageMap'

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']
const SUITS = ['c', 'd', 'h', 's']

const allCardCodes = RANKS.flatMap((r) => SUITS.map((s) => r + s))
const wildCodes = ['Wc', 'Wd', 'Wh', 'Ws']

describe('cardImageMap', () => {
  it('has an entry for all 52 standard card codes', () => {
    for (const code of allCardCodes) {
      expect(cardImageMap[code]).toBeDefined()
    }
  })

  it('has entries for all 4 wild deuce codes', () => {
    for (const code of wildCodes) {
      expect(cardImageMap[code]).toBeDefined()
    }
  })

  it('has a cardback entry', () => {
    expect(cardImageMap['cardback']).toBeDefined()
  })

  it('total keys = 52 + 4 wilds + cardback = 57', () => {
    expect(Object.keys(cardImageMap)).toHaveLength(57)
  })

  it('no values are null', () => {
    for (const value of Object.values(cardImageMap)) {
      expect(value).not.toBeNull()
    }
  })

  it('sample: Ace of clubs is defined', () => {
    expect(cardImageMap['Ac']).toBeDefined()
  })

  it('sample: Ten of hearts is defined', () => {
    expect(cardImageMap['Th']).toBeDefined()
  })

  it('sample: Wild deuce of spades is defined', () => {
    expect(cardImageMap['Ws']).toBeDefined()
  })
})
