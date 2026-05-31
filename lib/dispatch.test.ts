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

  it('returns actionPayload and title on success (status 200)', async () => {
    const actionPayload = '{"hand":["Ac","Kd"]}'

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        title: 'successful',
        data: { status: 200, data: { actionPayload } },
      }),
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

  it('returns error when title is not successful', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ title: 'Auth error', data: { status: 403 } }),
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('Auth error')
    expect(result.actionPayload).toBeUndefined()
  })

  it('returns error when status is not 200', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        title: 'successful',
        data: { status: 500, data: {} },
      }),
    })

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'setup', pt: 'Bonus_6_5' })

    expect(result.title).not.toBe('successful')
  })

  it('returns Network error on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const { asyncDispatch } = require('./dispatch')
    const result = await asyncDispatch({ name: 'check' })

    expect(result.title).toBe('Network error')
    expect(result.actionPayload).toBeUndefined()
  })

  it('sends Authorization header with Firebase token', async () => {
    const actionPayload = '{"gameState":"After Deal"}'
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        title: 'successful',
        data: { status: 200, data: { actionPayload } },
      }),
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
      json: async () => ({
        title: 'successful',
        data: { status: 200, data: { actionPayload: '{}' } },
      }),
    })

    const { asyncDispatch } = require('./dispatch')
    await asyncDispatch({ name: 'deal', pt: 'Bonus_6_5' })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer anon-token')
  })
})
