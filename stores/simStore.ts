import { create } from 'zustand'

interface SimState {
  // Hand state
  noSpacesHand: string
  displayHand: string
  hand: string[]
  httpHand: string[]
  holdCardPositions: number[]
  evSelectedCardPositions: number[]
  resultsList: any[][]
  evs: string[][]
  evButtons: any[]
  evRowHighlight: number
  strategyPrintLine: string
  suggestedHoldCards: string[]
  suggestedNewHand: string[]
  suggestedPayValue: number
  payValue: number
  playersNewHand: string[]
  newCardPositions: string[]
  // Game state
  gameState: string
  dealText: string
  dealTip: string
  gameNumber: number
  gameResults: string[]
  // Card display
  cardDisplay: string[]
  cardsHeld: string[]
  cardHoldCss: string[]
  cardHoldText: string[]
  // Credit tracking
  startCredit: number
  creditSum: number
  bestCreditSum: number
  winSum: number
  bestWin: number
  bestGameResults: string[]
  // Assist
  handAssist: boolean
  defaultAssist: boolean
  handAssistTip: string
  defaultAssistTip: string
  // UI state
  isKeyboardEnabled: boolean
  isPaytableOpen: boolean
  isSimHelpModalOpen: boolean
  displayProb: boolean
  helpLineMessage: string
  // Shadow EV ("what would it have been?")
  shadowHand: string[]
  shadowHandResults: any[]
  showShadowEv: boolean
  // History
  badlyPlayedHands: string[]
  replayHands: any[]
  positions: number[]
  // Other
  gamblerAlert: string | null
  displayPaytable: string[]
  paytable: any[]
  valueTable: string[]
  shortGameName: string
  fullGameName: string
  strategyTable: any[]
  appLoaded: boolean
  // Setters
  setNoSpacesHand: (v: string) => void
  setDisplayHand: (v: string) => void
  setHand: (v: string[]) => void
  setHttpHand: (v: string[]) => void
  setHoldCardPositions: (v: number[]) => void
  setEvSelectedCardPositions: (v: number[]) => void
  setResultsList: (v: any[][]) => void
  setEvs: (v: string[][]) => void
  setEvButtons: (v: any[]) => void
  setEvRowHighlight: (v: number) => void
  setStrategyPrintLine: (v: string) => void
  setSuggestedHoldCards: (v: string[]) => void
  setSuggestedNewHand: (v: string[]) => void
  setSuggestedPayValue: (v: number) => void
  setPayValue: (v: number) => void
  setPlayersNewHand: (v: string[]) => void
  setNewCardPositions: (v: string[]) => void
  setGameState: (v: string) => void
  setDealText: (v: string) => void
  setDealTip: (v: string) => void
  setGameNumber: (v: number) => void
  setGameResults: (v: string[]) => void
  setCardDisplay: (v: string[]) => void
  setCardsHeld: (v: string[]) => void
  setCardHoldCss: (v: string[]) => void
  setCardHoldText: (v: string[]) => void
  setCreditSum: (v: number) => void
  setBestCreditSum: (v: number) => void
  setWinSum: (v: number) => void
  setBestWin: (v: number) => void
  setBestGameResults: (v: string[]) => void
  setHandAssist: (v: boolean) => void
  setDefaultAssist: (v: boolean) => void
  setHandAssistTip: (v: string) => void
  setDefaultAssistTip: (v: string) => void
  setKeyboardEnabled: (v: boolean) => void
  setPaytableOpen: (v: boolean) => void
  setSimHelpModalOpen: (v: boolean) => void
  setDisplayProb: (v: boolean) => void
  setHelpLineMessage: (v: string) => void
  setShadowHand: (v: string[]) => void
  setShadowHandResults: (v: any[]) => void
  setShowShadowEv: (v: boolean) => void
  setBadlyPlayedHands: (v: string[]) => void
  setReplayHands: (v: any[]) => void
  setPositions: (v: number[]) => void
  setGamblerAlert: (v: string | null) => void
  setDisplayPaytable: (v: string[]) => void
  setPaytable: (v: any[]) => void
  setValueTable: (v: string[]) => void
  setShortGameName: (v: string) => void
  setFullGameName: (v: string) => void
  setStrategyTable: (v: any[]) => void
  setAppLoaded: (v: boolean) => void
}

const BLANK_CARDS = ['cardback', 'cardback', 'cardback', 'cardback', 'cardback']
const RELEASE_CARDS = ['Release', 'Release', 'Release', 'Release', 'Release']
const HOLD_NONE = ['hold_none', 'hold_none', 'hold_none', 'hold_none', 'hold_none']
const BLANK_TEXT = [' ', ' ', ' ', ' ', ' ']

export const useSimStore = create<SimState>((set) => ({
  noSpacesHand: 'XXXXXXXXXX',
  displayHand: '',
  hand: ['', '', '', '', ''],
  httpHand: [''],
  holdCardPositions: [],
  evSelectedCardPositions: [],
  resultsList: [],
  evs: [],
  evButtons: [],
  evRowHighlight: 0,
  strategyPrintLine: "PRESS 'DEAL' TO START",
  suggestedHoldCards: [],
  suggestedNewHand: [],
  suggestedPayValue: 0,
  payValue: 0,
  playersNewHand: [],
  newCardPositions: [],
  gameState: 'New Game',
  dealText: 'DEAL',
  dealTip: "PRESS 'DEAL' TO START",
  gameNumber: 0,
  gameResults: [],
  cardDisplay: [...BLANK_CARDS],
  cardsHeld: [...RELEASE_CARDS],
  cardHoldCss: [...HOLD_NONE],
  cardHoldText: [...BLANK_TEXT],
  startCredit: 100,
  creditSum: 100,
  bestCreditSum: 100,
  winSum: 0,
  bestWin: 0,
  bestGameResults: [],
  handAssist: true,
  defaultAssist: true,
  handAssistTip: "Showing advice for this hand",
  defaultAssistTip: "Hand advice is 'ON' by default",
  isKeyboardEnabled: false,
  isPaytableOpen: true,
  isSimHelpModalOpen: false,
  displayProb: false,
  helpLineMessage: '',
  shadowHand: [],
  shadowHandResults: [],
  showShadowEv: false,
  badlyPlayedHands: [],
  replayHands: [],
  positions: [],
  gamblerAlert: null,
  displayPaytable: [],
  paytable: [],
  valueTable: [],
  shortGameName: '',
  fullGameName: '',
  strategyTable: [],
  appLoaded: false,
  setNoSpacesHand: (v) => set({ noSpacesHand: v }),
  setDisplayHand: (v) => set({ displayHand: v }),
  setHand: (v) => set({ hand: v }),
  setHttpHand: (v) => set({ httpHand: v }),
  setHoldCardPositions: (v) => set({ holdCardPositions: v }),
  setEvSelectedCardPositions: (v) => set({ evSelectedCardPositions: v }),
  setResultsList: (v) => set({ resultsList: v }),
  setEvs: (v) => set({ evs: v }),
  setEvButtons: (v) => set({ evButtons: v }),
  setEvRowHighlight: (v) => set({ evRowHighlight: v }),
  setStrategyPrintLine: (v) => set({ strategyPrintLine: v }),
  setSuggestedHoldCards: (v) => set({ suggestedHoldCards: v }),
  setSuggestedNewHand: (v) => set({ suggestedNewHand: v }),
  setSuggestedPayValue: (v) => set({ suggestedPayValue: v }),
  setPayValue: (v) => set({ payValue: v }),
  setPlayersNewHand: (v) => set({ playersNewHand: v }),
  setNewCardPositions: (v) => set({ newCardPositions: v }),
  setGameState: (v) => set({ gameState: v }),
  setDealText: (v) => set({ dealText: v }),
  setDealTip: (v) => set({ dealTip: v }),
  setGameNumber: (v) => set({ gameNumber: v }),
  setGameResults: (v) => set({ gameResults: v }),
  setCardDisplay: (v) => set({ cardDisplay: v }),
  setCardsHeld: (v) => set({ cardsHeld: v }),
  setCardHoldCss: (v) => set({ cardHoldCss: v }),
  setCardHoldText: (v) => set({ cardHoldText: v }),
  setCreditSum: (v) => set({ creditSum: v }),
  setBestCreditSum: (v) => set({ bestCreditSum: v }),
  setWinSum: (v) => set({ winSum: v }),
  setBestWin: (v) => set({ bestWin: v }),
  setBestGameResults: (v) => set({ bestGameResults: v }),
  setHandAssist: (v) => set({ handAssist: v }),
  setDefaultAssist: (v) => set({ defaultAssist: v }),
  setHandAssistTip: (v) => set({ handAssistTip: v }),
  setDefaultAssistTip: (v) => set({ defaultAssistTip: v }),
  setKeyboardEnabled: (v) => set({ isKeyboardEnabled: v }),
  setPaytableOpen: (v) => set({ isPaytableOpen: v }),
  setSimHelpModalOpen: (v) => set({ isSimHelpModalOpen: v }),
  setDisplayProb: (v) => set({ displayProb: v }),
  setHelpLineMessage: (v) => set({ helpLineMessage: v }),
  setShadowHand: (v) => set({ shadowHand: v }),
  setShadowHandResults: (v) => set({ shadowHandResults: v }),
  setShowShadowEv: (v) => set({ showShadowEv: v }),
  setBadlyPlayedHands: (v) => set({ badlyPlayedHands: v }),
  setReplayHands: (v) => set({ replayHands: v }),
  setPositions: (v) => set({ positions: v }),
  setGamblerAlert: (v) => set({ gamblerAlert: v }),
  setDisplayPaytable: (v) => set({ displayPaytable: v }),
  setPaytable: (v) => set({ paytable: v }),
  setValueTable: (v) => set({ valueTable: v }),
  setShortGameName: (v) => set({ shortGameName: v }),
  setFullGameName: (v) => set({ fullGameName: v }),
  setStrategyTable: (v) => set({ strategyTable: v }),
  setAppLoaded: (v) => set({ appLoaded: v }),
}))
