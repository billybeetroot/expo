import pako from 'pako'
import { decodeCheck, decodePlain } from './decode'

function makeCompressedPayload(obj: unknown): string {
  const inner = JSON.stringify(JSON.stringify(obj))
  const deflated = pako.deflate(inner)
  return btoa(String.fromCharCode(...deflated))
}

describe('decodeCheck', () => {
  it('decompresses and double-parses a check response payload', () => {
    const original = {
      gameState: 'After Deal',
      holdCardPositions: [1, 3],
      strategyPrintLine: 'Two pair',
      evs: [['0.86'], ['0.74']],
      payValue: 2,
    }
    const payload = makeCompressedPayload(original)
    expect(decodeCheck(payload)).toEqual(original)
  })

  it('handles an empty object payload', () => {
    const payload = makeCompressedPayload({})
    expect(decodeCheck(payload)).toEqual({})
  })

  it('throws on invalid base64', () => {
    expect(() => decodeCheck('!!!not-valid!!!')).toThrow()
  })
})

describe('decodePlain', () => {
  it('parses a plain (single-stringified) JSON payload', () => {
    const original = {
      hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'],
      gameState: 'After Deal',
      payValue: 0,
      holdCardPositions: [1, 2],
    }
    const payload = JSON.stringify(original)
    expect(decodePlain(payload)).toEqual(original)
  })

  it('handles a deal response shape', () => {
    const dealResult = {
      hand: ['2c', '2d', 'Ah', 'Ks', 'Qc'],
      holdCardPositions: [1, 2],
      suggestedHoldCards: ['2c', '2d'],
      strategyPrintLine: 'Pair of deuces',
      gameState: 'After Deal',
      payValue: 0,
      evs: [['0.80']],
      resultsList: [],
    }
    expect(decodePlain(JSON.stringify(dealResult))).toEqual(dealResult)
  })

  it('throws on non-JSON string', () => {
    expect(() => decodePlain('not-json')).toThrow()
  })
})
