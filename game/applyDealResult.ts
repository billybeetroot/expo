import { getDispHand } from '@/lib/cardDeck'

export interface DealResultState {
  hand: string[]
  noSpacesHand: string
  displayHand: string
  evs: string[][]
  resultsList: any[][]
  strategyPrintLine: string
  suggestedHoldCards: string[]
  holdCardPositions: number[]
  payValue: number
  gameState: string
  gamblerAlert: string | null
  cardsHeld: string[]
  cardHoldCss: string[]
  cardHoldText: string[]
  dealText: 'DRAW'
  evSelectedCardPositions: number[]
}

export function applyDealResult(raw: any): DealResultState {
  const hand: string[] = raw.hand ?? []
  const holdCardPositions: number[] = raw.holdCardPositions ?? []
  const noSpacesHand = hand.join('').padEnd(10, 'X').slice(0, 10)

  const cardsHeld = ['Release', 'Release', 'Release', 'Release', 'Release']
  const cardHoldCss = ['hold_none', 'hold_none', 'hold_none', 'hold_none', 'hold_none']
  const cardHoldText = [' ', ' ', ' ', ' ', ' ']

  for (const pos of holdCardPositions) {
    const idx = pos - 1
    if (idx >= 0 && idx < 5) {
      cardsHeld[idx] = 'Hold'
      cardHoldCss[idx] = 'hold_hold'
      cardHoldText[idx] = 'HOLD'
    }
  }

  return {
    hand,
    noSpacesHand,
    displayHand: getDispHand(noSpacesHand),
    evs: raw.evs ?? [],
    resultsList: raw.resultsList ?? [],
    strategyPrintLine: raw.strategyPrintLine ?? '',
    suggestedHoldCards: raw.suggestedHoldCards ?? [],
    holdCardPositions,
    payValue: raw.payValue ?? 0,
    gameState: raw.gameState ?? 'After Deal',
    gamblerAlert: raw.gamblerAlert ?? null,
    cardsHeld,
    cardHoldCss,
    cardHoldText,
    dealText: 'DRAW',
    evSelectedCardPositions: holdCardPositions,
  }
}
