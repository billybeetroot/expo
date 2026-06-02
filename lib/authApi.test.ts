const mockCreateUser = jest.fn()
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockUpdateProfile = jest.fn()
const mockSendPasswordReset = jest.fn()
const mockSendEmailVerification = jest.fn()
const mockGetIdToken = jest.fn().mockResolvedValue('mock-token')
const mockGetIdTokenResult = jest.fn().mockResolvedValue({ token: 'mock-token' })

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...a: any[]) => mockCreateUser(...a),
  signInWithEmailAndPassword: (...a: any[]) => mockSignIn(...a),
  signOut: (...a: any[]) => mockSignOut(...a),
  updateProfile: (...a: any[]) => mockUpdateProfile(...a),
  sendPasswordResetEmail: (...a: any[]) => mockSendPasswordReset(...a),
  sendEmailVerification: (...a: any[]) => mockSendEmailVerification(...a),
}))

jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      uid: 'uid-123',
      getIdToken: () => mockGetIdToken(),
      getIdTokenResult: () => mockGetIdTokenResult(),
    },
  },
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockUser = {
  uid: 'uid-123',
  getIdToken: () => mockGetIdToken(),
  getIdTokenResult: () => mockGetIdTokenResult(),
}

beforeEach(() => {
  jest.resetModules()
  mockFetch.mockReset()
  mockCreateUser.mockReset()
  mockSignIn.mockReset()
  mockSignOut.mockReset()
  mockUpdateProfile.mockReset()
  mockSendPasswordReset.mockReset()
  mockSendEmailVerification.mockReset()
})

describe('signUp', () => {
  it('creates Firebase user, updates profile, and calls /api/auth/signup', async () => {
    mockCreateUser.mockResolvedValue({ user: mockUser })
    mockUpdateProfile.mockResolvedValue(undefined)
    mockFetch.mockResolvedValue({
      json: async () => ({ title: 'successful', data: { status: 200 } }),
    })

    const { signUp } = require('./authApi')
    const result = await signUp('Alice', 'alice@example.com', 'password123')

    expect(result.title).toBe('successful')
    expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), 'alice@example.com', 'password123')
    expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Alice' })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/auth/signup')
    expect(opts.headers.Authorization).toBe('Bearer mock-token')
    const body = JSON.parse(opts.body)
    expect(body.name).toBe('Alice')
  })

  it('returns Firebase error message on createUserWithEmailAndPassword failure', async () => {
    const err = Object.assign(new Error(), { code: 'auth/email-already-in-use' })
    mockCreateUser.mockRejectedValue(err)

    const { signUp } = require('./authApi')
    const result = await signUp('Alice', 'alice@example.com', 'pw')

    expect(result.title).toBe('Email already in use. Please try another email.')
    expect(result.data).toBeUndefined()
  })
})

describe('signIn', () => {
  it('calls Firebase signIn, then /api/auth/login, returns LoginData', async () => {
    mockSignIn.mockResolvedValue({ user: mockUser })
    const loginData = {
      status: 200,
      username: 'Alice',
      member: 'false',
      previousGames: '',
      ppOrderId: '',
      ppPlanId: '',
      ppPlanType: '',
      ppSubscriptionId: '',
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      paymentPlanType: '',
    }
    mockFetch.mockResolvedValue({
      json: async () => ({ title: 'successful', data: loginData }),
    })

    const { signIn } = require('./authApi')
    const result = await signIn('alice@example.com', 'password123')

    expect(result.title).toBe('successful')
    expect(result.data?.username).toBe('Alice')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/auth/login')
    const body = JSON.parse(opts.body)
    expect(body.forceTakeover).toBe(true)
    expect(typeof body.concurrentSessionId).toBe('string')
  })

  it('returns Firebase error message on wrong password', async () => {
    const err = Object.assign(new Error(), { code: 'auth/wrong-password' })
    mockSignIn.mockRejectedValue(err)

    const { signIn } = require('./authApi')
    const result = await signIn('a@b.com', 'wrong')

    expect(result.title).toBe('Incorrect password. Please try again.')
  })
})

describe('logoutUser', () => {
  it('calls /api/auth/logout and Firebase signOut', async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ title: 'Logout successful' }) })
    mockSignOut.mockResolvedValue(undefined)

    const { logoutUser } = require('./authApi')
    const result = await logoutUser()

    expect(result.title).toBe('successful')
    expect(mockSignOut).toHaveBeenCalled()
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/auth/logout')
  })

  it('still signs out Firebase even if server call throws', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    mockSignOut.mockResolvedValue(undefined)

    const { logoutUser } = require('./authApi')
    const result = await logoutUser()

    expect(result.title).toBe('successful')
    expect(mockSignOut).toHaveBeenCalled()
  })
})

describe('sendNewPasswordEmail', () => {
  it('calls sendPasswordResetEmail', async () => {
    mockSendPasswordReset.mockResolvedValue(undefined)
    const { sendNewPasswordEmail } = require('./authApi')
    const result = await sendNewPasswordEmail('a@b.com')
    expect(result.title).toBe('successful')
    expect(mockSendPasswordReset).toHaveBeenCalledWith(expect.anything(), 'a@b.com')
  })
})

describe('savePreviousGames', () => {
  it('posts correct body to /api/auth/previousgames', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ title: 'successful', data: { status: 200 } }),
    })

    const { savePreviousGames } = require('./authApi')
    const result = await savePreviousGames('a@b.com', 'Bonus,Bonus,6/5')

    expect(result.title).toBe('successful')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/auth/previousgames')
    const body = JSON.parse(opts.body)
    expect(body.action).toBe('UPDATE')
    expect(body.email).toBe('a@b.com')
    expect(body.previousGames).toBe('Bonus,Bonus,6/5')
  })
})
