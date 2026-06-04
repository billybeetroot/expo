import { VoiceIntent } from './interpretCommand'

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

// Groups 1-based positions by rank, highest rank first.
function groupByRank(hand: string[]): Array<{ rank: string; positions: number[] }> {
  const byRank: Record<string, number[]> = {}
  hand.forEach((card, i) => {
    const r = card[0].toUpperCase()
    ;(byRank[r] ??= []).push(i + 1)
  })
  return RANK_ORDER.filter((r) => byRank[r]).map((r) => ({ rank: r, positions: byRank[r]! }))
}

// Translates a VoiceIntent into 1-based hold positions given the current 5-card hand.
// Returns [] for hold_none or when the target rank/suit is absent.
// hand elements are 2-char codes e.g. ['Ac','Kd','Th','Jh','2s']
export function intentToPositions(intent: VoiceIntent, hand: string[]): number[] {
  if (!hand || hand.length !== 5) return []

  switch (intent.intent) {
    case 'hold_all':
      return [1, 2, 3, 4, 5]

    case 'hold_none':
      return []

    case 'draw':
      return []

    case 'hold_positions':
      return (intent.positions ?? []).filter((p) => p >= 1 && p <= 5)

    case 'hold_rank': {
      const want = String(intent.rank).toUpperCase()
      return hand
        .map((card, i) => ({ card, pos: i + 1 }))
        .filter((x) => x.card[0].toUpperCase() === want)
        .map((x) => x.pos)
    }

    case 'hold_ranks': {
      const want = new Set((intent.ranks ?? []).map((r) => r.toUpperCase()))
      return hand
        .map((card, i) => ({ card, pos: i + 1 }))
        .filter((x) => want.has(x.card[0].toUpperCase()))
        .map((x) => x.pos)
    }

    case 'hold_suit': {
      const suit = intent.suit?.toLowerCase()
      return hand
        .map((card, i) => ({ card, pos: i + 1 }))
        .filter((x) => x.card.slice(-1).toLowerCase() === suit)
        .map((x) => x.pos)
    }

    case 'hold_pair': {
      const groups = groupByRank(hand)
      const pair = groups.find((g) => g.positions.length >= 2)
      return pair ? pair.positions.slice(0, 2) : []
    }

    case 'hold_two_pair': {
      const groups = groupByRank(hand)
      const pairs = groups.filter((g) => g.positions.length >= 2).slice(0, 2)
      if (pairs.length < 2) return []
      return [...pairs[0]!.positions.slice(0, 2), ...pairs[1]!.positions.slice(0, 2)].sort(
        (a, b) => a - b
      )
    }

    case 'hold_trips': {
      const groups = groupByRank(hand)
      const trips = groups.find((g) => g.positions.length >= 3)
      return trips ? trips.positions.slice(0, 3) : []
    }

    default:
      return []
  }
}
