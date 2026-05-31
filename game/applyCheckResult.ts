export interface CheckResultState {
  coinsPlayed: string
  coinValue: string
  displayPaytable: string[]
  evs: string[][]
  gameState: string
  hand: string[]
  holdCardPositions: number[]
  evSelectedCardPositions: number[] // set to holdCardPositions (optimal hold)
  paytable: any[]
  payValue: number
  pt: string
  resultsList: any[][]
  strategyPrintLine: string
  suggestedHoldCards: string[]
  valueTable: string[]
  gamblerAlert: string | null
}

export function applyCheckResult(result: unknown): CheckResultState {
  const r = result as any
  const holdCardPositions: number[] = r.holdCardPositions ?? []

  return {
    coinsPlayed: r.coinsPlayed ?? '',
    coinValue: r.coinValue ?? '',
    displayPaytable: r.displayPaytable ?? [],
    evs: r.evs ?? [],
    gameState: r.gameState ?? 'After Deal',
    hand: r.hand ?? [],
    holdCardPositions,
    evSelectedCardPositions: holdCardPositions, // start with engine's optimal hold
    paytable: r.paytable ?? [],
    payValue: r.payValue ?? 0,
    pt: r.pt ?? '',
    resultsList: r.resultsList ?? [],
    strategyPrintLine: r.strategyPrintLine ?? '',
    suggestedHoldCards: r.suggestedHoldCards ?? [],
    valueTable: r.valueTable ?? [],
    gamblerAlert: r.gamblerAlert ?? null,
  }
}
