import { create } from 'zustand'

interface GameState {
  noSpacesHand: string
  displayHand: string
  hand: string[]
  httpHand: string[]
  originalHand: string
  holdCardPositions: number[]
  evSelectedCardPositions: number[]
  resultsList: any[][]
  evs: string[][]
  evButtons: any[]
  evRowHighlight: number
  strategyPrintLine: string
  suggestedHoldCards: string[]
  payValue: number
  gameState: string
  isKeyboardEnabled: boolean
  isPaytableOpen: boolean
  isLiveHelpModalOpen: boolean
  displayProb: boolean
  displayPaytable: string[]
  paytable: string[]
  valueTable: string[]
  // Setters
  setNoSpacesHand: (v: string) => void
  setDisplayHand: (v: string) => void
  setHand: (v: string[]) => void
  setHttpHand: (v: string[]) => void
  setOriginalHand: (v: string) => void
  setHoldCardPositions: (v: number[]) => void
  setEvSelectedCardPositions: (v: number[]) => void
  setResultsList: (v: any[][]) => void
  setEvs: (v: string[][]) => void
  setEvButtons: (v: any[]) => void
  setEvRowHighlight: (v: number) => void
  setStrategyPrintLine: (v: string) => void
  setSuggestedHoldCards: (v: string[]) => void
  setPayValue: (v: number) => void
  setGameState: (v: string) => void
  setKeyboardEnabled: (v: boolean) => void
  setPaytableOpen: (v: boolean) => void
  setLiveHelpModalOpen: (v: boolean) => void
  setDisplayProb: (v: boolean) => void
  setDisplayPaytable: (v: string[]) => void
  setPaytable: (v: string[]) => void
  setValueTable: (v: string[]) => void
}

export const useGameStore = create<GameState>((set) => ({
  noSpacesHand: 'XXXXXXXXXX',
  displayHand: '',
  hand: ['', '', '', '', ''],
  httpHand: [''],
  originalHand: '',
  holdCardPositions: [],
  evSelectedCardPositions: [],
  resultsList: [],
  evs: [],
  evButtons: [],
  evRowHighlight: 0,
  strategyPrintLine: "PRESS 'DEAL' TO START",
  suggestedHoldCards: [],
  payValue: 0,
  gameState: 'New Game',
  isKeyboardEnabled: true,
  isPaytableOpen: false,
  isLiveHelpModalOpen: false,
  displayProb: false,
  displayPaytable: [],
  paytable: [],
  valueTable: [],
  setNoSpacesHand: (v) => set({ noSpacesHand: v }),
  setDisplayHand: (v) => set({ displayHand: v }),
  setHand: (v) => set({ hand: v }),
  setHttpHand: (v) => set({ httpHand: v }),
  setOriginalHand: (v) => set({ originalHand: v }),
  setHoldCardPositions: (v) => set({ holdCardPositions: v }),
  setEvSelectedCardPositions: (v) => set({ evSelectedCardPositions: v }),
  setResultsList: (v) => set({ resultsList: v }),
  setEvs: (v) => set({ evs: v }),
  setEvButtons: (v) => set({ evButtons: v }),
  setEvRowHighlight: (v) => set({ evRowHighlight: v }),
  setStrategyPrintLine: (v) => set({ strategyPrintLine: v }),
  setSuggestedHoldCards: (v) => set({ suggestedHoldCards: v }),
  setPayValue: (v) => set({ payValue: v }),
  setGameState: (v) => set({ gameState: v }),
  setKeyboardEnabled: (v) => set({ isKeyboardEnabled: v }),
  setPaytableOpen: (v) => set({ isPaytableOpen: v }),
  setLiveHelpModalOpen: (v) => set({ isLiveHelpModalOpen: v }),
  setDisplayProb: (v) => set({ displayProb: v }),
  setDisplayPaytable: (v) => set({ displayPaytable: v }),
  setPaytable: (v) => set({ paytable: v }),
  setValueTable: (v) => set({ valueTable: v }),
}))
