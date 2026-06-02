import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'

const USE_LOCAL_BACKEND = true // set false to point at vegaslearning.com
const API_URL = USE_LOCAL_BACKEND
  ? 'http://localhost:8000/api/'
  : `${process.env.EXPO_PUBLIC_API_URL ?? 'https://vegaslearning.com'}/api/`

async function getToken(): Promise<string> {
  let user = auth.currentUser
  if (!user) {
    const cred = await signInAnonymously(auth)
    user = cred.user
  }
  return user.getIdToken()
}

export type DispatchResult =
  | { title: 'successful'; actionPayload: string }
  | { title: string; actionPayload?: undefined }

export async function asyncDispatch(
  actionData: Record<string, unknown>
): Promise<DispatchResult> {
  try {
    const token = await getToken()
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(actionData),
    })

    if (!res.ok) {
      return { title: `HTTP ${res.status}` }
    }

    const raw = await res.json()

    // Django returns the payload directly — no np2 envelope:
    //   'check'              → base64+zlib compressed string
    //   'setup'/'deal'/'draw' → plain JSON object
    let actionPayload: string
    if (typeof raw === 'string') {
      actionPayload = raw
    } else if (raw !== null && typeof raw === 'object') {
      actionPayload = JSON.stringify(raw)
    } else {
      return { title: 'Empty response' }
    }

    return { title: 'successful', actionPayload }
  } catch (err) {
    return { title: 'Network error' }
  }
}
