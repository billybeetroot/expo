import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { sendNewPasswordEmail } from '@/lib/authApi'
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'

export default function ForgotScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const result = await sendNewPasswordEmail(email.trim().toLowerCase())
      if (result.title === 'successful') {
        setMessage('Password reset email sent. Check your inbox.')
      } else {
        setError(result.title)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onBack={() => router.back()} />
      <View style={styles.form}>
        <Text style={styles.title}>Reset Password</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!message && <Text style={styles.success}>{message}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Pressable
          onPress={handleReset}
          disabled={loading}
          style={[styles.btn, loading && styles.btnDisabled]}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>SEND RESET EMAIL</Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  form: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.white, marginBottom: 24 },
  error: {
    fontSize: 13, color: '#ff6b6b', marginBottom: 12,
    backgroundColor: 'rgba(255,107,107,0.1)', padding: 10, borderRadius: 6,
  },
  success: {
    fontSize: 13, color: '#6bff8e', marginBottom: 12,
    backgroundColor: 'rgba(107,255,142,0.1)', padding: 10, borderRadius: 6,
  },
  input: {
    backgroundColor: '#0a2535', color: Colors.white, fontSize: 15,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.tabBarBorder,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  btn: {
    backgroundColor: Colors.orange, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
})
