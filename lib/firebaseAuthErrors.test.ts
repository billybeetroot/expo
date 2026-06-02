import generateFirebaseAuthErrorMessage from './firebaseAuthErrors'

function makeError(code: string) {
  return { code }
}

describe('generateFirebaseAuthErrorMessage', () => {
  it('maps auth/invalid-email', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/invalid-email')))
      .toBe('Invalid email address. Please enter a valid email.')
  })

  it('maps auth/wrong-password', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/wrong-password')))
      .toBe('Incorrect password. Please try again.')
  })

  it('maps auth/email-already-in-use', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/email-already-in-use')))
      .toBe('Email already in use. Please try another email.')
  })

  it('maps auth/weak-password', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/weak-password')))
      .toBe('Password should be at least 6 characters.')
  })

  it('maps auth/user-not-found', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/user-not-found')))
      .toBe('User not found. Please check the email address.')
  })

  it('maps auth/network-request-failed', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/network-request-failed')))
      .toBe('Network request failed. Please try again.')
  })

  it('maps unknown code to default message', () => {
    expect(generateFirebaseAuthErrorMessage(makeError('auth/something-unknown')))
      .toBe('Oops! Something went wrong. Please try again later.')
  })
})
