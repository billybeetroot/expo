import { applyDealResult } from './applyDealResult'

const rawDeal = {
  hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'],
  evs: [['7.63', 17], ['6.04', 1]],
  resultsList: [[['Ac', 'Kd'], ['Th', 'Jh', '2s'], '7.63']],
  strategyPrintLine: 'Royal Flush draw',
  suggestedHoldCards: ['Ac', 'Kd'],
  holdCardPositions: [1, 2],
  payValue: 0,
  gameState: 'After Deal',
  gamblerAlert: null,
}

describe('applyDealResult', () => {
  it('derives noSpacesHand from hand array', () => {
    expect(applyDealResult(rawDeal).noSpacesHand).toBe('AcKdThJh2s')
  })

  it('sets dealText to DRAW', () => {
    expect(applyDealResult(rawDeal).dealText).toBe('DRAW')
  })

  it('maps holdCardPositions to cardsHeld (1-based → 0-based)', () => {
    const r = applyDealResult(rawDeal)
    expect(r.cardsHeld).toEqual(['Hold', 'Hold', 'Release', 'Release', 'Release'])
  })

  it('sets cardHoldCss from holdCardPositions', () => {
    const r = applyDealResult(rawDeal)
    expect(r.cardHoldCss[0]).toBe('hold_hold')
    expect(r.cardHoldCss[1]).toBe('hold_hold')
    expect(r.cardHoldCss[2]).toBe('hold_none')
  })

  it('sets cardHoldText from holdCardPositions', () => {
    const r = applyDealResult(rawDeal)
    expect(r.cardHoldText[0]).toBe('HOLD')
    expect(r.cardHoldText[2]).toBe(' ')
  })

  it('sets evSelectedCardPositions to holdCardPositions', () => {
    expect(applyDealResult(rawDeal).evSelectedCardPositions).toEqual([1, 2])
  })

  it('passes through evs, resultsList, strategyPrintLine', () => {
    const r = applyDealResult(rawDeal)
    expect(r.evs).toEqual(rawDeal.evs)
    expect(r.resultsList).toEqual(rawDeal.resultsList)
    expect(r.strategyPrintLine).toBe('Royal Flush draw')
  })

  it('handles empty holdCardPositions', () => {
    const r = applyDealResult({ ...rawDeal, holdCardPositions: [] })
    expect(r.cardsHeld).toEqual(['Release', 'Release', 'Release', 'Release', 'Release'])
  })

  it('passes through gamblerAlert', () => {
    const r = applyDealResult({ ...rawDeal, gamblerAlert: 'EQUAL_EV' })
    expect(r.gamblerAlert).toBe('EQUAL_EV')
  })
})
