import { create } from 'zustand'

interface AppState {
  // Auth
  isLoggedIn: boolean
  isMember: boolean
  isSignedUp: boolean
  userName: string
  userEmail: string
  // Game config
  gameName: string
  gameType: string
  displayName: string
  paytableName: string
  pt: string
  coinValue: string
  coinsPlayed: string
  isDeuces: boolean
  isGameConfigured: boolean
  previousGames: string
  // Subscription
  ppPlanType: string
  ppPlanId: string
  ppOrderId: string
  ppSubscriptionId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePlanType: string
  // Voice
  isVoiceEnabled: boolean
  isVoiceSupported: boolean
  // Drawer / config modal
  isDrawerOpen: boolean
  // Setters
  setLoggedIn: (v: boolean) => void
  setMember: (v: boolean) => void
  setSignedUp: (v: boolean) => void
  setUserName: (v: string) => void
  setUserEmail: (v: string) => void
  setGameName: (v: string) => void
  setGameType: (v: string) => void
  setDisplayName: (v: string) => void
  setPaytableName: (v: string) => void
  setPt: (v: string) => void
  setCoinValue: (v: string) => void
  setCoinsPlayed: (v: string) => void
  setDeuces: (v: boolean) => void
  setGameConfigured: (v: boolean) => void
  setPreviousGames: (v: string) => void
  setPpPlanType: (v: string) => void
  setPpPlanId: (v: string) => void
  setPpOrderId: (v: string) => void
  setPpSubscriptionId: (v: string) => void
  setStripeSubscriptionId: (v: string) => void
  setStripeCustomerId: (v: string) => void
  setStripePlanType: (v: string) => void
  setVoiceEnabled: (v: boolean) => void
  setVoiceSupported: (v: boolean) => void
  setDrawerOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  isLoggedIn: false,
  isMember: false,
  isSignedUp: false,
  userName: '',
  userEmail: '',
  gameName: 'Bonus',
  gameType: 'Bonus Poker',
  displayName: 'Bonus Poker',
  paytableName: '6/5',
  pt: 'Bonus_6_5',
  coinValue: '1',
  coinsPlayed: '5',
  isDeuces: false,
  isGameConfigured: false,
  previousGames: '',
  ppPlanType: '',
  ppPlanId: '',
  ppOrderId: '',
  ppSubscriptionId: '',
  stripeSubscriptionId: '',
  stripeCustomerId: '',
  stripePlanType: '',
  isVoiceEnabled: false,
  isVoiceSupported: false,
  isDrawerOpen: false,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  setMember: (v) => set({ isMember: v }),
  setSignedUp: (v) => set({ isSignedUp: v }),
  setUserName: (v) => set({ userName: v }),
  setUserEmail: (v) => set({ userEmail: v }),
  setGameName: (v) => set({ gameName: v }),
  setGameType: (v) => set({ gameType: v }),
  setDisplayName: (v) => set({ displayName: v }),
  setPaytableName: (v) => set({ paytableName: v }),
  setPt: (v) => set({ pt: v }),
  setCoinValue: (v) => set({ coinValue: v }),
  setCoinsPlayed: (v) => set({ coinsPlayed: v }),
  setDeuces: (v) => set({ isDeuces: v }),
  setGameConfigured: (v) => set({ isGameConfigured: v }),
  setPreviousGames: (v) => set({ previousGames: v }),
  setPpPlanType: (v) => set({ ppPlanType: v }),
  setPpPlanId: (v) => set({ ppPlanId: v }),
  setPpOrderId: (v) => set({ ppOrderId: v }),
  setPpSubscriptionId: (v) => set({ ppSubscriptionId: v }),
  setStripeSubscriptionId: (v) => set({ stripeSubscriptionId: v }),
  setStripeCustomerId: (v) => set({ stripeCustomerId: v }),
  setStripePlanType: (v) => set({ stripePlanType: v }),
  setVoiceEnabled: (v) => set({ isVoiceEnabled: v }),
  setVoiceSupported: (v) => set({ isVoiceSupported: v }),
  setDrawerOpen: (v) => set({ isDrawerOpen: v }),
}))
