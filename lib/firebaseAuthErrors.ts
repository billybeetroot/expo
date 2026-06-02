interface FirebaseAuthError { code: string }

const generateFirebaseAuthErrorMessage = (error: FirebaseAuthError): string => {
  switch (error?.code) {
    case 'auth/invalid-email': return 'Invalid email address. Please enter a valid email.'
    case 'auth/user-not-found': return 'User not found. Please check the email address.'
    case 'auth/wrong-password': return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use': return 'Email already in use. Please try another email.'
    case 'auth/weak-password': return 'Password should be at least 6 characters.'
    case 'auth/operation-not-allowed': return 'Operation not allowed. Please try again later.'
    case 'auth/user-disabled': return 'User disabled. Please contact support.'
    case 'auth/invalid-credential': return 'Invalid credential. Please try again.'
    case 'auth/invalid-user-token': return 'Invalid user token. Please try again.'
    case 'auth/network-request-failed': return 'Network request failed. Please try again.'
    case 'auth/requires-recent-login': return 'Requires recent login. Please try again.'
    case 'auth/too-many-requests': return 'Too many requests. Please try again.'
    case 'auth/user-token-expired': return 'User token expired. Please try again.'
    case 'auth/account-exists-with-different-credential': return 'Account exists with different credential. Please try again.'
    default: return 'Oops! Something went wrong. Please try again later.'
  }
}

export default generateFirebaseAuthErrorMessage
