import { applyDrawResult } from './applyDrawResult'

// paytable[payValue][coinsPlayed]
const paytable = [
  [0, 0, 0, 0, 0, 0],     // 0 = nothing
  [0, 1, 2, 3, 4, 5],     // 1 = jacks or better
  [0, 2, 4, 6, 8, 10],    // 2 = two pair
  [0, 3, 6, 9, 12, 15],   // 3 = three of a kind
]

const drawResults = {
  payValue: 1,
  gameState: 'New Game',
  badlyPlayedHand: [],
  helpLineMessage: 'CORRECT HOLD.',
  holdPrintLine: 'JACKS OR BETTER',
  newCardPositions: ['3', '4', '5'],
  playersNewHand: ['Ac', 'Kd', 'Th', 'Jh', 'Qs'],
  shadowHand: ['Ac', 'Kd', '3h', 'Jh', 'Qs'],
  shadowHandsResults: [{ ev: '2.5' }],
  suggestedNewHand: ['Ac', 'Kd'],
  suggestedPayValue: 1,
  gamblerAlert: null,
}

const state = {
  paytable,
  coinValue: '1',
  coinsPlayed: '5',
  creditSum: 90,
  bestCreditSum: 90,
  gameNumber: 0,
  evs: [['7.63', 17], ['6.04', 1]],
  hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'],
  holdCardPositions: [1, 2],
  isDeuces: false,
}

describe('applyDrawResult', () => {
  it('computes winSum: paytable[payValue][coinsPlayed] * coinValue', () => {
    // paytable[1][5] * 1 = 5
    expect(applyDrawResult(drawResults, state).winSum).toBe(5)
  })

  it('adds winSum to creditSum', () => {
    expect(applyDrawResult(drawResults, state).creditSum).toBe(95)
  })

  it('computes bestWin from suggestedPayValue', () => {
    expect(applyDrawResult(drawResults, state).bestWin).toBe(5)
  })

  it('adds bestWin to bestCreditSum', () => {
    expect(applyDrawResult(drawResults, state).bestCreditSum).toBe(95)
  })

  it('increments gameNumber', () => {
    expect(applyDrawResult(drawResults, state).gameNumber).toBe(1)
  })

  it('derives noSpacesHand from playersNewHand', () => {
    expect(applyDrawResult(drawResults, state).noSpacesHand).toBe('AcKdThJhQs')
  })

  it('maps playersNewHand', () => {
    expect(applyDrawResult(drawResults, state).playersNewHand)
      .toEqual(['Ac', 'Kd', 'Th', 'Jh', 'Qs'])
  })

  it('sets strategyPrintLine from holdPrintLine', () => {
    expect(applyDrawResult(drawResults, state).strategyPrintLine).toBe('JACKS OR BETTER')
  })

  it('maps shadowHand and shadowHandResults', () => {
    const r = applyDrawResult(drawResults, state)
    expect(r.shadowHand).toEqual(['Ac', 'Kd', '3h', 'Jh', 'Qs'])
    expect(r.shadowHandResults).toEqual([{ ev: '2.5' }])
  })

  it('produces CORRECT HOLD - WIN! for holdOutcomeMessage', () => {
    expect(applyDrawResult(drawResults, state).holdOutcomeMessage)
      .toBe('CORRECT HOLD - WIN!')
  })

  it('produces BAD HOLD when wrong hold and no win', () => {
    const badDraw = { ...drawResults, payValue: 0, helpLineMessage: 'You should hold: Ac', suggestedPayValue: 1 }
    expect(applyDrawResult(badDraw, state).holdOutcomeMessage).toBe('BAD HOLD')
  })

  it('winSum = 0 when payValue = 0', () => {
    const r = applyDrawResult({ ...drawResults, payValue: 0 }, state)
    expect(r.winSum).toBe(0)
    expect(r.creditSum).toBe(90)
  })

  it('substitutes 2x → Wx in cardDisplay for deuces wild', () => {
    const deucesResults = { ...drawResults, playersNewHand: ['2c', 'Kd', '2h', 'Jh', 'Qs'] }
    const r = applyDrawResult(deucesResults, { ...state, isDeuces: true })
    expect(r.cardDisplay[0]).toBe('Wc')
    expect(r.cardDisplay[2]).toBe('Wh')
    expect(r.cardDisplay[1]).toBe('Kd') // non-deuce unchanged
  })
})
