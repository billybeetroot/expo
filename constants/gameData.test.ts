import { GAME_GROUPS, DENOM_VALUES, DENOM_LABELS, BET_OPTIONS, ptFromVariantPaytable } from './gameData'

describe('GAME_GROUPS structure', () => {
  it('has exactly 5 game groups', () => {
    expect(GAME_GROUPS).toHaveLength(5)
  })

  it('each group has at least one variant', () => {
    for (const group of GAME_GROUPS) {
      expect(group.variants.length).toBeGreaterThan(0)
    }
  })

  it('each variant has at least one paytable', () => {
    for (const group of GAME_GROUPS) {
      for (const variant of group.variants) {
        expect(variant.paytables.length).toBeGreaterThan(0)
      }
    }
  })

  it('game type names match expected set', () => {
    const types = GAME_GROUPS.map((g) => g.gameType)
    expect(types).toContain('Bonus Poker')
    expect(types).toContain('Double Double Bonus')
    expect(types).toContain('Triple Bonus Poker')
    expect(types).toContain('Deuces Wild Poker')
    expect(types).toContain('Other Poker Games')
  })

  it('isDeuces is true only for Deuces Wild group', () => {
    for (const group of GAME_GROUPS) {
      if (group.gameType === 'Deuces Wild Poker') {
        expect(group.isDeuces).toBe(true)
      } else {
        expect(group.isDeuces).not.toBe(true)
      }
    }
  })
})

describe('ptFromVariantPaytable', () => {
  it('uses explicit code when present', () => {
    expect(ptFromVariantPaytable('Bonus', { value: '9/6', name: '9/6', code: 'Bonus_9_6' }))
      .toBe('Bonus_9_6')
  })

  it('derives pt from gameName + value when no code', () => {
    expect(ptFromVariantPaytable('TripleBonus', { value: '10/7/5', name: '10/7/5' }))
      .toBe('TripleBonus_10_7_5')
  })

  it('replaces all slashes with underscores', () => {
    expect(ptFromVariantPaytable('DoubleBonus', { value: '50/10/7/5', name: 'x' }))
      .toBe('DoubleBonus_50_10_7_5')
  })

  it('handles Deuces alias codes', () => {
    expect(ptFromVariantPaytable('Deuces', { value: 'FPDW', name: 'Full Pay', code: 'Deuces_FPDW' }))
      .toBe('Deuces_FPDW')
  })

  it('derives pt for Deuces non-alias paytables', () => {
    expect(ptFromVariantPaytable('Deuces', { value: '20/12/10/4/4/3', name: 'x' }))
      .toBe('Deuces_20_12_10_4_4_3')
  })
})

describe('pt derivation — spot checks across all groups', () => {
  const cases: [string, string, string, string][] = [
    // [gameType, variantDisplayName, paytableValue, expectedPt]
    ['Bonus Poker', 'Bonus Poker', '6/5', 'Bonus_6_5'],
    ['Bonus Poker', 'Double Bonus', '50/10/7/5', 'DoubleBonus_50_10_7_5'],
    ['Double Double Bonus', 'Double Double Bonus', '9/6', 'DDBonus_9_6'],
    ['Double Double Bonus', 'Super Dbl Dbl Bonus', '50/8/6', 'SDDBonus_50_8_6'],
    ['Triple Bonus Poker', 'Triple Bonus Poker', '10/7/5', 'TripleBonus_10_7_5'],
    ['Triple Bonus Poker', 'Triple Double Bonus', '400/50/9/7/4', 'TripleDblBonus_400_50_9_7_4'],
    ['Deuces Wild Poker', 'Deuces Wild Poker', 'FPDW', 'Deuces_FPDW'],
    ['Deuces Wild Poker', 'Deuces Wild Bonus', '10/4/3', 'DeucesBonus_10_4_3'],
    ['Other Poker Games', 'Jacks or Better', '9/6', 'Jacks_9_6'],
    ['Other Poker Games', 'USA Poker', '7/7', 'USA_7_7'],
  ]

  for (const [gameType, variantName, ptValue, expectedPt] of cases) {
    it(`${variantName} ${ptValue} → ${expectedPt}`, () => {
      const group = GAME_GROUPS.find((g) => g.gameType === gameType)!
      expect(group).toBeDefined()
      const variant = group.variants.find((v) => v.displayName === variantName)!
      expect(variant).toBeDefined()
      const item = variant.paytables.find((p) => p.value === ptValue)!
      expect(item).toBeDefined()
      expect(ptFromVariantPaytable(variant.gameName, item)).toBe(expectedPt)
    })
  }
})

describe('denomination constants', () => {
  it('DENOM_LABELS and DENOM_VALUES have same length', () => {
    expect(DENOM_LABELS.length).toBe(DENOM_VALUES.length)
  })

  it('maps 25c → 0.25', () => {
    const idx = DENOM_LABELS.indexOf('25c')
    expect(DENOM_VALUES[idx]).toBe('0.25')
  })

  it('maps $1 → 1', () => {
    const idx = DENOM_LABELS.indexOf('$1')
    expect(DENOM_VALUES[idx]).toBe('1')
  })
})

describe('BET_OPTIONS', () => {
  it('has 5 options from 1 to 5', () => {
    expect(BET_OPTIONS).toEqual(['1', '2', '3', '4', '5'])
  })
})
