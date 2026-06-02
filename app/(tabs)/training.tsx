import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

export default function TrainingScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Training</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  sub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
})
