import { gameIcons } from './gameIcons'

const SUITS = ['c', 'd', 'h', 's']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

export function getDeck(): string[] {
  const deck: string[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit)
    }
  }
  return deck
}

export function shuffleDeck(deck: string[]): string[] {
  for (let i = 0; i < 1000; i++) {
    const a = Math.floor(Math.random() * deck.length)
    const b = Math.floor(Math.random() * deck.length)
    const tmp = deck[a]
    deck[a] = deck[b]!
    deck[b] = tmp!
  }
  return deck
}

export function dealCards(deck: string[], numCards: number): string[] {
  const hand: string[] = []
  for (let i = 0; i < numCards; i++) {
    hand.push(deck.pop()!)
  }
  return hand
}

export function getDispHand(hand: string): string {
  const { club, diamond, heart, spade } = gameIcons
  let dispHand = ''
  for (let i = 0; i < hand.length; i++) {
    const ch = hand[i]!
    if (ch === 'c') dispHand += club
    else if (ch === 'd') dispHand += diamond
    else if (ch === 'h') dispHand += heart
    else if (ch === 's') dispHand += spade
    else dispHand += ch
  }
  return dispHand
}

export function sortBadHoldCards(cardString: string): string[] {
  const rankOrder: Record<string, number> = {
    '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
    '8': 7, '9': 8, T: 9, J: 10, Q: 11, K: 12, A: 13,
  }
  return cardString
    .split(' ')
    .filter((item) => item !== '')
    .sort((x, y) => (rankOrder[x[0]!] ?? 0) - (rankOrder[y[0]!] ?? 0))
}
