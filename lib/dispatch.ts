import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'
import { decompressPayload } from './compression'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://vegaslearning.com'

async function getToken(): Promise<string | null> {
  let user = auth.currentUser
  if (!user) {
    const cred = await signInAnonymously(auth)
    user = cred.user
  }
  return user.getIdToken()
}

export async function asyncDispatch(
  actionData: Record<string, unknown>
): Promise<{ title: string; data: unknown }> {
  try {
    const token = await getToken()
    const res = await fetch(`${API_BASE}/api/common/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(actionData),
    })

    const json = await res.json()

    if (json?.title !== 'successful') {
      return { title: json?.title ?? 'Error', data: json?.data ?? '' }
    }

    const actionPayload = json?.data?.data?.actionPayload
    if (!actionPayload) {
      return { title: json.title, data: json.data }
    }

    const data = decompressPayload(actionPayload)
    return { title: 'successful', data }
  } catch (err) {
    return { title: 'Network error', data: String(err) }
  }
}
