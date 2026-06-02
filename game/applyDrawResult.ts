import { formatHoldMessage } from './formatHoldMessage'

export interface DrawParams {
  paytable: any[]
  coinValue: string
  coinsPlayed: string
  creditSum: number
  bestCreditSum: number
  gameNumber: number
  evs: string[][]
  hand: string[]
  holdCardPositions: number[]
  isDeuces: boolean
}

export interface DrawResultState {
  noSpacesHand: string
  playersNewHand: string[]
  strategyPrintLine: string
  payValue: number
  suggestedPayValue: number
  winSum: number
  creditSum: number
  bestWin: number
  bestCreditSum: number
  gameNumber: number
  shadowHand: string[]
  shadowHandResults: any[]
  helpLineMessage: string
  holdOutcomeMessage: string
  badlyPlayedHand: string[]
  newCardPositions: string[]
  suggestedNewHand: string[]
  cardDisplay: string[]
}

export function applyDrawResult(raw: any, params: DrawParams): DrawResultState {
  const {
    paytable, coinValue, coinsPlayed, creditSum, bestCreditSum,
    gameNumber, evs, hand, holdCardPositions, isDeuces,
  } = params

  const payValue: number = raw.payValue ?? 0
  const suggestedPayValue: number = raw.suggestedPayValue ?? 0
  const coinsIdx = Number(coinsPlayed)
  const cv = Number(coinValue)

  const winSum = ((paytable?.[payValue]?.[coinsIdx] as number) ?? 0) * cv
  const bestWin = ((paytable?.[suggestedPayValue]?.[coinsIdx] as number) ?? 0) * cv

  const playersNewHand: string[] = raw.playersNewHand ?? []
  const noSpacesHand = playersNewHand.join('').padEnd(10, 'X').slice(0, 10)

  // Card display with deuces wild substitution (2x → Wx)
  const cardDisplay: string[] = playersNewHand.map((card) => {
    if (isDeuces && typeof card === 'string' && card[0] === '2' && card.length === 2) {
      return `W${card[1]}`
    }
    return card ?? ''
  })

  const holdOutcomeMessage = formatHoldMessage(
    raw.helpLineMessage ?? '',
    raw.gamblerAlert ?? null,
    payValue,
    evs,
    hand,
    isDeuces
  )

  return {
    noSpacesHand,
    playersNewHand,
    strategyPrintLine: raw.holdPrintLine ?? '',
    payValue,
    suggestedPayValue,
    winSum,
    creditSum: creditSum + winSum,
    bestWin,
    bestCreditSum: bestCreditSum + bestWin,
    gameNumber: gameNumber + 1,
    shadowHand: raw.shadowHand ?? [],
    shadowHandResults: raw.shadowHandsResults ?? [],
    helpLineMessage: raw.helpLineMessage ?? '',
    holdOutcomeMessage,
    badlyPlayedHand: raw.badlyPlayedHand ?? [],
    newCardPositions: raw.newCardPositions ?? [],
    suggestedNewHand: raw.suggestedNewHand ?? [],
    cardDisplay,
  }
}
