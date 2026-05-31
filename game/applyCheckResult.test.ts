import { applyCheckResult } from './applyCheckResult'

const sampleResult = {
  coinsPlayed: '5',
  coinValue: '1',
  displayPaytable: ['Royal Flush  800', 'Straight Flush  50'],
  evs: [['0.86', '0.14']],
  gameState: 'After Deal',
  hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'],
  holdCardPositions: [1, 2],
  paytable: ['800', '50'],
  payValue: 2,
  pt: 'Bonus_6_5',
  resultsList: [[['Ac', 'Kd'], ['Th', 'Jh', '2s'], '0.86']],
  strategyPrintLine: 'Two pair — hold Ac Kd',
  suggestedHoldCards: ['Ac', 'Kd'],
  valueTable: ['800'],
  gamblerAlert: null,
}

describe('applyCheckResult', () => {
  it('extracts gameState', () => {
    expect(applyCheckResult(sampleResult).gameState).toBe('After Deal')
  })

  it('extracts holdCardPositions', () => {
    expect(applyCheckResult(sampleResult).holdCardPositions).toEqual([1, 2])
  })

  it('sets evSelectedCardPositions equal to holdCardPositions (start with optimal)', () => {
    const state = applyCheckResult(sampleResult)
    expect(state.evSelectedCardPositions).toEqual(state.holdCardPositions)
  })

  it('extracts strategyPrintLine', () => {
    expect(applyCheckResult(sampleResult).strategyPrintLine).toBe('Two pair — hold Ac Kd')
  })

  it('extracts resultsList', () => {
    expect(applyCheckResult(sampleResult).resultsList).toHaveLength(1)
  })

  it('extracts evs', () => {
    expect(applyCheckResult(sampleResult).evs).toEqual([['0.86', '0.14']])
  })

  it('extracts suggestedHoldCards', () => {
    expect(applyCheckResult(sampleResult).suggestedHoldCards).toEqual(['Ac', 'Kd'])
  })

  it('extracts payValue', () => {
    expect(applyCheckResult(sampleResult).payValue).toBe(2)
  })

  it('extracts all display/paytable fields', () => {
    const state = applyCheckResult(sampleResult)
    expect(state.displayPaytable).toHaveLength(2)
    expect(state.paytable).toHaveLength(2)
    expect(state.valueTable).toHaveLength(1)
    expect(state.hand).toEqual(['Ac', 'Kd', 'Th', 'Jh', '2s'])
    expect(state.pt).toBe('Bonus_6_5')
    expect(state.coinsPlayed).toBe('5')
    expect(state.coinValue).toBe('1')
  })

  it('extracts gamblerAlert', () => {
    expect(applyCheckResult(sampleResult).gamblerAlert).toBeNull()
    const withAlert = { ...sampleResult, gamblerAlert: 'EQUAL_EV' }
    expect(applyCheckResult(withAlert).gamblerAlert).toBe('EQUAL_EV')
  })
})
