import pako from 'pako'
import { decompressPayload } from './compression'

function makePayload(obj: unknown): string {
  const inner = JSON.stringify(JSON.stringify(obj))
  const deflated = pako.deflate(inner)
  return btoa(String.fromCharCode(...deflated))
}

describe('decompressPayload', () => {
  it('decompresses a base64+pako payload back to the original object', () => {
    const original = { gameState: 'After Deal', payValue: 5 }
    const payload = makePayload(original)
    expect(decompressPayload(payload)).toEqual(original)
  })

  it('handles a string payload', () => {
    const payload = makePayload('hello')
    expect(decompressPayload(payload)).toBe('hello')
  })

  it('throws on invalid base64', () => {
    expect(() => decompressPayload('!!!not-base64!!!')).toThrow()
  })
})
