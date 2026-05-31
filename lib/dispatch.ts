import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://vegaslearning.com'

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
    const res = await fetch(`${API_BASE}/api/common/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(actionData),
    })

    const json = await res.json()

    if (json?.title !== 'successful') {
      return { title: json?.title ?? 'Error' }
    }
    if (json?.data?.status !== 200) {
      return { title: 'Server error' }
    }

    const actionPayload: string = json?.data?.data?.actionPayload
    if (!actionPayload) {
      return { title: 'Empty response' }
    }

    return { title: 'successful', actionPayload }
  } catch (err) {
    return { title: 'Network error' }
  }
}
