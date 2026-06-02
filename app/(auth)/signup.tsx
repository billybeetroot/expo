import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { signUp } from '@/lib/authApi'
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'

export default function SignupScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await signUp(name.trim(), email.trim().toLowerCase(), password)
      if (result.title !== 'successful') {
        setError(result.title)
        return
      }
      // Signed up — go to login to complete sign-in flow
      router.replace('/(auth)/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Pressable
            onPress={handleSignup}
            disabled={loading}
            style={[styles.btn, loading && styles.btnDisabled]}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>CREATE ACCOUNT</Text>
            }
          </Pressable>

          <View style={styles.row}>
            <Text style={styles.mutedText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.linkText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  flex: { flex: 1 },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 24,
  },
  error: {
    fontSize: 13,
    color: '#ff6b6b',
    marginBottom: 12,
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 10,
    borderRadius: 6,
  },
  input: {
    backgroundColor: '#0a2535',
    color: Colors.white,
    fontSize: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tabBarBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  mutedText: { fontSize: 14, color: Colors.textMuted },
  linkText: { fontSize: 14, color: Colors.orange, fontWeight: '600' },
})
