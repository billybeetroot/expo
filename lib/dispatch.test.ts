import pako from 'pako'

jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue({ user: { getIdToken: jest.fn().mockResolvedValue('test-token') } }),
}))

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    },
  },
}))

function makeActionPayload(obj: unknown): string {
  const inner = JSON.stringify(JSON.stringify(obj))
  const deflated = pako.deflate(inner)
  return btoa(String.fromCharCode(...deflated))
}

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('asyncDispatch', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFetch.mockReset()
  })

  it('returns decompressed data on successful response', async () => {
    const payload = { gameState: 'After Deal', hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'] }
    const actionPayload = makeActionPayload(payload)

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        title: 'successful',
        data: { data: { actionPayload } },
      }),
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check', hand: '["Ac","Kd","Th","Jh","2s"]', pt: 'Bonus_6_5', coinsPlayed: '5', coinValue: '1' })

    expect(result.title).toBe('successful')
    expect(result.data).toEqual(payload)
  })

  it('returns error title when API response is not successful', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ title: 'Auth error', data: 'Unauthorized' }),
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('Auth error')
  })

  it('returns Network error on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('Network error')
  })

  it('sends Authorization header with Firebase token', async () => {
    const actionPayload = makeActionPayload({})
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ title: 'successful', data: { data: { actionPayload } } }),
    })

    const { asyncDispatch } = require('./dispatch')
    await asyncDispatch({ name: 'setup', pt: 'Bonus_6_5' })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer test-token')
  })
})
