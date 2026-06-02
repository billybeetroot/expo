import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAppStore } from '@/stores/appStore'

export default function RootLayout() {
  const { setLoggedIn, setUserEmail, setUserName } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setLoggedIn(true)
        setUserEmail(user.email ?? '')
        setUserName(user.displayName ?? '')
      } else {
        setLoggedIn(false)
        setUserEmail('')
        setUserName('')
        // Pre-warm anonymous auth so the Firebase token is ready before first DEAL.
        // Avoids the "Token used too early" clock-skew delay in Django on first dispatch.
        if (!user) {
          signInAnonymously(auth).catch(() => {})
        }
      }
    })
    return unsub
  }, [])

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="liveplay/results" options={{ headerShown: false }} />
        <Stack.Screen
          name="config"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  )
}
