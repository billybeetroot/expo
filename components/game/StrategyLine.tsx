import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface StrategyLineProps {
  text: string
}

export default function StrategyLine({ text }: StrategyLineProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
        {text.toUpperCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.bannerBg,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 0,
    marginVertical: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.bannerText,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
})
