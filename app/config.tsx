import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/colors'
import AppHeader from '@/components/ui/AppHeader'
import { SafeAreaView } from 'react-native'

export default function ConfigScreen() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onBack={() => router.back()} />
      <View style={styles.center}>
        <Text style={styles.title}>Game Configuration</Text>
        <Text style={styles.sub}>Coming in Phase 6</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>CLOSE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.textMuted, marginBottom: 32 },
  btn: {
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: Colors.orange },
})
