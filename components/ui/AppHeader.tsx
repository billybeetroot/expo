import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface AppHeaderProps {
  onBack?: () => void
  onMenu?: () => void
}

export default function AppHeader({ onBack, onMenu }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.sideBtn} accessibilityLabel="Back">
            <Text style={styles.sideIcon}>←</Text>
          </Pressable>
        ) : onMenu ? (
          <Pressable onPress={onMenu} style={styles.sideBtn} accessibilityLabel="Menu">
            <Text style={styles.sideIcon}>≡</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.titleTop}>PerfectPLAY</Text>
        <Text style={styles.titleBot}>VideoPoker™</Text>
      </View>

      <View style={styles.side} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBarBorder,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideBtn: {
    padding: 8,
  },
  sideIcon: {
    fontSize: 22,
    color: Colors.orange,
    fontWeight: '700',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  titleTop: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  titleBot: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
})
