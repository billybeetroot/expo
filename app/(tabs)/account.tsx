import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '@/stores/appStore'
import { logoutUser } from '@/lib/authApi'
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'

export default function AccountScreen() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const {
    isLoggedIn, isMember, userName, userEmail,
    setLoggedIn, setMember, setUserName, setUserEmail,
    setPreviousGames, setPpOrderId, setPpPlanId, setPpPlanType,
    setPpSubscriptionId, setStripeCustomerId, setStripeSubscriptionId, setStripePlanType,
  } = useAppStore()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutUser()
      // Clear membership state (auth state cleared by onAuthStateChanged in _layout)
      setMember(false)
      setPreviousGames('')
      setPpOrderId('')
      setPpPlanId('')
      setPpPlanType('')
      setPpSubscriptionId('')
      setStripeCustomerId('')
      setStripeSubscriptionId('')
      setStripePlanType('')
    } catch {
      Alert.alert('Error', 'Logout failed. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader />
        <View style={styles.center}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.sub}>Sign in to access your membership and game history.</Text>
          <Pressable style={styles.btn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.btnText}>SIGN IN</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.outlineBtnText}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.card}>
          <Text style={styles.label}>NAME</Text>
          <Text style={styles.value}>{userName || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <Text style={styles.value}>{userEmail || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>MEMBERSHIP</Text>
          <Text style={[styles.value, isMember ? styles.memberActive : styles.memberInactive]}>
            {isMember ? 'Active Member' : 'Free Demo'}
          </Text>
        </View>

        {!isMember && (
          <View style={styles.ctaBox}>
            <Text style={styles.ctaText}>
              Upgrade to access all 18 game variants and personalised strategy.
            </Text>
            <Text style={styles.ctaPrice}>$12.95/month · $99/year · $4.99 / 48 hrs</Text>
          </View>
        )}

        <Pressable
          style={[styles.logoutBtn, loggingOut && styles.btnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.logoutText}>SIGN OUT</Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  btnDisabled: { opacity: 0.5 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '700', color: Colors.orange, letterSpacing: 1 },
  card: {
    backgroundColor: '#0a2535',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.tabBarBorder,
  },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 15, color: Colors.white, fontWeight: '500' },
  memberActive: { color: '#6bff8e', fontWeight: '700' },
  memberInactive: { color: Colors.textMuted },
  ctaBox: {
    backgroundColor: 'rgba(232,119,34,0.12)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,119,34,0.3)',
  },
  ctaText: { fontSize: 13, color: Colors.textLight, lineHeight: 18, marginBottom: 6 },
  ctaPrice: { fontSize: 12, color: Colors.orange, fontWeight: '600' },
  logoutBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.tabBarBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
})
