import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

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
    backgroundColor: '#F5C842',
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
})
