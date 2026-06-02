import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import generateFirebaseAuthErrorMessage from './firebaseAuthErrors'

function isFirebaseAuthError(err: unknown): err is { code: string } {
  return (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    String((err as Record<string, unknown>).code).startsWith('auth/')
  )
}

// Auth endpoints live on perfectplay.vegas (np2 Next.js), not the Django backend.
const AUTH_URL = `${process.env.EXPO_PUBLIC_AUTH_URL ?? 'https://perfectplay.vegas'}/api/auth`

export interface AuthResult<T = unknown> {
  title: string
  data?: T
}

export interface LoginData {
  username: string
  member: string        // 'true' | 'false'
  previousGames: string
  ppOrderId: string
  ppPlanId: string
  ppPlanType: string
  ppSubscriptionId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  paymentPlanType: string
  accessExpiresAt?: string
}

async function getBearerToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  const result = await user.getIdTokenResult(true)
  return result.token
}

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const token = await cred.user.getIdToken()
    const res = await fetch(`${AUTH_URL}/signup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cred.user.uid, name, signupcity: '', signupcountry: '', previousgames: '' }),
    })
    const json = await res.json()
    if (json?.title !== 'successful') {
      return { title: json?.title ?? 'Signup error', data: json?.data }
    }
    return { title: 'successful', data: json.data }
  } catch (err) {
    if (isFirebaseAuthError(err)) return { title: generateFirebaseAuthErrorMessage(err) }
    return { title: 'Signup failed. Please try again.' }
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<LoginData>> {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    const token = await getBearerToken()
    if (!token) return { title: 'Could not get auth token.' }
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concurrentSessionId: randomId(),
        deviceKey: randomId(),
        forceTakeover: true,
        logincity: '',
        logincountry: '',
      }),
    })
    const json = await res.json()
    if (json?.title !== 'successful') {
      return { title: json?.title ?? 'Login error', data: json?.data }
    }
    return { title: 'successful', data: json.data as LoginData }
  } catch (err) {
    if (isFirebaseAuthError(err)) return { title: generateFirebaseAuthErrorMessage(err) }
    return { title: 'Sign in failed. Please try again.' }
  }
}

export async function logoutUser(): Promise<AuthResult> {
  try {
    const token = await getBearerToken()
    if (token) {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
    }
  } catch {
    // Server call failed — still sign out locally below
  }
  try { await signOut(auth) } catch {}
  return { title: 'successful' }
}

export async function sendNewPasswordEmail(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email)
    return { title: 'successful' }
  } catch (err) {
    if (isFirebaseAuthError(err)) return { title: generateFirebaseAuthErrorMessage(err) }
    return { title: 'Failed to send password reset email.' }
  }
}

export async function sendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser
  if (!user) return { title: 'No user signed in.' }
  try {
    await sendEmailVerification(user)
    return { title: 'successful' }
  } catch (err) {
    if (isFirebaseAuthError(err)) return { title: generateFirebaseAuthErrorMessage(err) }
    return { title: 'Failed to send verification email.' }
  }
}

export async function savePreviousGames(
  email: string,
  previousGames: string
): Promise<AuthResult> {
  try {
    const token = await getBearerToken()
    if (!token) return { title: 'Not authenticated.' }
    const res = await fetch(`${AUTH_URL}/previousgames`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE', email, previousGames }),
    })
    const json = await res.json()
    return { title: json?.title ?? 'successful' }
  } catch {
    return { title: 'Failed to save previous games.' }
  }
}
