import { parsePreviousGames, serializePreviousGames, prependPreviousGame } from './previousGames'

const BONUS = { displayName: 'Bonus Poker', gameName: 'Bonus', paytableName: '6/5' }
const JACKS = { displayName: 'Jacks or Better', gameName: 'Jacks', paytableName: '9/6' }
const DBLBONUS = { displayName: 'Double Bonus', gameName: 'DoubleBonus', paytableName: '50/10/7/5' }
const DDBONUS = { displayName: 'Double Double Bonus', gameName: 'DDBonus', paytableName: '9/6' }
const DEUCES = { displayName: 'Deuces Wild Poker', gameName: 'Deuces', paytableName: 'FPDW' }
const TRIPLEDB = { displayName: 'Triple Double Bonus', gameName: 'TripleDblBonus', paytableName: '400/50/9/7/4' }

describe('parsePreviousGames', () => {
  it('returns empty array for empty string', () => {
    expect(parsePreviousGames('')).toEqual([])
  })

  it('returns empty array for whitespace', () => {
    expect(parsePreviousGames('   ')).toEqual([])
  })

  it('parses a single game triple', () => {
    expect(parsePreviousGames('Bonus Poker,Bonus,6/5')).toEqual([BONUS])
  })

  it('parses multiple game triples', () => {
    const raw = 'Bonus Poker,Bonus,6/5,Jacks or Better,Jacks,9/6'
    expect(parsePreviousGames(raw)).toEqual([BONUS, JACKS])
  })

  it('caps at 5 games even if more tokens present', () => {
    const raw = [BONUS, JACKS, DBLBONUS, DDBONUS, DEUCES, TRIPLEDB]
      .map((g) => `${g.displayName},${g.gameName},${g.paytableName}`)
      .join(',')
    const result = parsePreviousGames(raw)
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual(BONUS)
    expect(result[4]).toEqual(DEUCES)
  })

  it('ignores partial triples at the end', () => {
    expect(parsePreviousGames('Bonus Poker,Bonus')).toEqual([])
  })

  it('skips triples with empty fields', () => {
    const raw = ',Bonus,6/5,Jacks or Better,Jacks,9/6'
    expect(parsePreviousGames(raw)).toEqual([JACKS])
  })

  it('parses games with complex paytable values', () => {
    const raw = 'Double Bonus,DoubleBonus,50/10/7/5,Deuces Wild Poker,Deuces,FPDW'
    expect(parsePreviousGames(raw)).toEqual([DBLBONUS, DEUCES])
  })
})

describe('serializePreviousGames', () => {
  it('serializes empty list to empty string', () => {
    expect(serializePreviousGames([])).toBe('')
  })

  it('serializes a single game', () => {
    expect(serializePreviousGames([BONUS])).toBe('Bonus Poker,Bonus,6/5')
  })

  it('serializes multiple games', () => {
    const result = serializePreviousGames([BONUS, JACKS])
    expect(result).toBe('Bonus Poker,Bonus,6/5,Jacks or Better,Jacks,9/6')
  })

  it('round-trips parse → serialize', () => {
    const raw = 'Bonus Poker,Bonus,6/5,Jacks or Better,Jacks,9/6'
    expect(serializePreviousGames(parsePreviousGames(raw))).toBe(raw)
  })
})

describe('prependPreviousGame', () => {
  it('prepends a new game to an empty list', () => {
    const result = prependPreviousGame('', BONUS)
    expect(parsePreviousGames(result)).toEqual([BONUS])
  })

  it('prepends a new game to an existing list', () => {
    const existing = serializePreviousGames([BONUS])
    const result = prependPreviousGame(existing, JACKS)
    expect(parsePreviousGames(result)).toEqual([JACKS, BONUS])
  })

  it('deduplicates: same gameName+paytableName moves to front', () => {
    const existing = serializePreviousGames([JACKS, BONUS, DBLBONUS])
    const result = prependPreviousGame(existing, BONUS)
    const parsed = parsePreviousGames(result)
    expect(parsed[0]).toEqual(BONUS)
    expect(parsed).toHaveLength(3)
    expect(parsed.findIndex((g) => g.gameName === 'Bonus')).toBe(0)
  })

  it('truncates to 5 games', () => {
    const existing = serializePreviousGames([BONUS, JACKS, DBLBONUS, DDBONUS, DEUCES])
    const result = prependPreviousGame(existing, TRIPLEDB)
    const parsed = parsePreviousGames(result)
    expect(parsed).toHaveLength(5)
    expect(parsed[0]).toEqual(TRIPLEDB)
    expect(parsed[4]).toEqual(DDBONUS) // DEUCES dropped off the end
  })

  it('dedup + prepend keeps list at ≤5 when already full', () => {
    const existing = serializePreviousGames([BONUS, JACKS, DBLBONUS, DDBONUS, DEUCES])
    const result = prependPreviousGame(existing, JACKS) // re-select JACKS
    const parsed = parsePreviousGames(result)
    expect(parsed).toHaveLength(5)
    expect(parsed[0]).toEqual(JACKS)
  })
})
