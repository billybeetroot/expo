import { intentToPositions } from './applyHoldIntent'
import { VoiceIntent } from './interpretCommand'

const HAND = ['Ac', 'Kd', 'Th', 'Jh', '2s'] // A K T J 2

describe('intentToPositions', () => {
  it('hold_all returns [1,2,3,4,5]', () => {
    expect(intentToPositions({ intent: 'hold_all' }, HAND)).toEqual([1, 2, 3, 4, 5])
  })

  it('hold_none returns []', () => {
    expect(intentToPositions({ intent: 'hold_none' }, HAND)).toEqual([])
  })

  it('draw returns []', () => {
    expect(intentToPositions({ intent: 'draw' }, HAND)).toEqual([])
  })

  it('hold_positions returns given positions', () => {
    expect(intentToPositions({ intent: 'hold_positions', positions: [1, 3, 5] }, HAND)).toEqual([1, 3, 5])
  })

  it('hold_positions filters out-of-range values', () => {
    expect(intentToPositions({ intent: 'hold_positions', positions: [0, 2, 6] }, HAND)).toEqual([2])
  })

  it('hold_rank finds matching cards', () => {
    expect(intentToPositions({ intent: 'hold_rank', rank: 'A', count: 1 }, HAND)).toEqual([1])
  })

  it('hold_rank returns [] when rank not in hand', () => {
    expect(intentToPositions({ intent: 'hold_rank', rank: 'Q', count: 1 }, HAND)).toEqual([])
  })

  it('hold_rank finds all copies of the rank', () => {
    const hand = ['Ac', 'Ad', 'Th', 'Jh', '2s']
    expect(intentToPositions({ intent: 'hold_rank', rank: 'A', count: 2 }, hand)).toEqual([1, 2])
  })

  it('hold_ranks finds multiple ranks', () => {
    expect(intentToPositions({ intent: 'hold_ranks', ranks: ['A', 'K'] }, HAND)).toEqual([1, 2])
  })

  it('hold_ranks ignores ranks not in hand', () => {
    expect(intentToPositions({ intent: 'hold_ranks', ranks: ['A', 'Q'] }, HAND)).toEqual([1])
  })

  it('hold_suit finds hearts', () => {
    expect(intentToPositions({ intent: 'hold_suit', suit: 'h' }, HAND)).toEqual([3, 4])
  })

  it('hold_suit returns [] when suit absent', () => {
    expect(intentToPositions({ intent: 'hold_suit', suit: 'c' }, ['Ks', 'Qd', 'Jh', 'Th', '9s'])).toEqual([])
  })

  it('hold_pair finds highest pair', () => {
    const hand = ['Ac', 'Ad', 'Ks', 'Qh', 'Jd'] // pair of aces
    expect(intentToPositions({ intent: 'hold_pair' }, hand)).toEqual([1, 2])
  })

  it('hold_pair returns [] when no pair', () => {
    expect(intentToPositions({ intent: 'hold_pair' }, HAND)).toEqual([])
  })

  it('hold_pair with lower pair picks highest rank', () => {
    const hand = ['Kc', 'Kd', 'Qh', 'Jd', '9s']
    expect(intentToPositions({ intent: 'hold_pair' }, hand)).toEqual([1, 2])
  })

  it('hold_two_pair finds both pairs', () => {
    const hand = ['Ac', 'Ad', 'Ks', 'Kh', 'Jd']
    expect(intentToPositions({ intent: 'hold_two_pair' }, hand)).toEqual([1, 2, 3, 4])
  })

  it('hold_two_pair returns [] when only one pair', () => {
    const hand = ['Ac', 'Ad', 'Ks', 'Qh', 'Jd']
    expect(intentToPositions({ intent: 'hold_two_pair' }, hand)).toEqual([])
  })

  it('hold_trips finds three of a kind', () => {
    const hand = ['Ac', 'Ad', 'Ah', 'Kh', '2s']
    expect(intentToPositions({ intent: 'hold_trips' }, hand)).toEqual([1, 2, 3])
  })

  it('hold_trips returns [] when no trips', () => {
    expect(intentToPositions({ intent: 'hold_trips' }, HAND)).toEqual([])
  })

  it('returns [] for empty hand', () => {
    expect(intentToPositions({ intent: 'hold_all' }, [])).toEqual([])
  })

  it('hold_pair with two pairs picks the highest-ranked pair', () => {
    const hand = ['Kc', 'Kd', 'Jh', 'Jd', 'Ac']
    const positions = intentToPositions({ intent: 'hold_pair' }, hand)
    // Highest pair is Kings (positions 1,2 by rank order)
    expect(positions).toEqual([1, 2])
  })
})
