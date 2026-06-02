jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue({
    user: { getIdToken: jest.fn().mockResolvedValue('test-token') },
  }),
}))

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    },
  },
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('asyncDispatch', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFetch.mockReset()
  })

  it('returns actionPayload for check (base64 string from Django)', async () => {
    const actionPayload = 'base64encodedpayload=='

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => actionPayload,
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({
      name: 'check',
      hand: '["Ac","Kd","Th","Jh","2s"]',
      pt: 'Bonus_6_5',
      coinsPlayed: '5',
      coinValue: '1',
    })

    expect(result.title).toBe('successful')
    expect(result.actionPayload).toBe(actionPayload)
  })

  it('returns actionPayload for setup/deal/draw (JSON object from Django)', async () => {
    const obj = { gameState: 'New Game', hand: ['Ac', 'Kd', 'Th', 'Jh', '2s'] }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => obj,
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'setup', pt: 'Bonus_6_5' })

    expect(result.title).toBe('successful')
    expect(result.actionPayload).toBe(JSON.stringify(obj))
  })

  it('returns HTTP error title on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('HTTP 500')
    expect(result.actionPayload).toBeUndefined()
  })

  it('returns Network error on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('Network error')
    expect(result.actionPayload).toBeUndefined()
  })

  it('sends Authorization header with Firebase token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { asyncDispatch } = require('./dispatch')
    await asyncDispatch({ name: 'setup', pt: 'Bonus_6_5' })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer test-token')
  })

  it('signs in anonymously when no current user', async () => {
    jest.resetModules()
    jest.mock('./firebase', () => ({ auth: { currentUser: null } }))
    jest.mock('firebase/auth', () => ({
      signInAnonymously: jest.fn().mockResolvedValue({
        user: { getIdToken: jest.fn().mockResolvedValue('anon-token') },
      }),
    }))
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { asyncDispatch } = require('./dispatch')
    await asyncDispatch({ name: 'deal', pt: 'Bonus_6_5' })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer anon-token')
  })
})
