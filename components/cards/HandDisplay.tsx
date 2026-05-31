import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import CardImage from './CardImage'

type AppMode = 'LP' | 'FG' | 'LP Results'

interface HandDisplayProps {
  app: AppMode
  noSpacesHand: string
  cardHoldText?: string[]
  cardHoldCss?: string[]
  onCardPress?: (cardIndex: number) => void
}

const CARD_WIDTH = 60
const CARD_HEIGHT = 84

function cardCodeAt(noSpacesHand: string, index: number): string {
  const start = index * 2
  if (start + 2 > noSpacesHand.length) return 'XX'
  const code = noSpacesHand.slice(start, start + 2)
  return code === 'XX' ? 'XX' : code
}

function holdChipStyle(css: string | undefined) {
  if (css === 'hold_held') return styles.chipHeld
  if (css === 'hold_hold') return styles.chipHold
  return styles.chipHidden
}

export default function HandDisplay({
  app,
  noSpacesHand,
  cardHoldText,
  cardHoldCss,
  onCardPress,
}: HandDisplayProps) {
  const isTappable = app === 'FG' && !!onCardPress

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => {
        const code = cardCodeAt(noSpacesHand, i)
        const chipText = cardHoldText?.[i] ?? ' '
        const chipCss = cardHoldCss?.[i]
        const showChip = chipText.trim().length > 0

        return (
          <View key={i} style={styles.slot}>
            {/* Hold chip above card */}
            <View style={[styles.chip, holdChipStyle(chipCss)]}>
              {showChip && (
                <Text style={styles.chipText}>{chipText}</Text>
              )}
            </View>

            {/* Card image — tappable in FG mode */}
            {isTappable ? (
              <Pressable
                testID={`card-slot-${i}`}
                accessibilityLabel={`Card ${i + 1}`}
                onPress={() => onCardPress(i)}
              >
                <CardImage code={code} width={CARD_WIDTH} height={CARD_HEIGHT} />
              </Pressable>
            ) : (
              <View testID={`card-slot-${i}`} accessibilityLabel={`Card ${i + 1}`}>
                <CardImage code={code} width={CARD_WIDTH} height={CARD_HEIGHT} />
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
  },
  slot: {
    alignItems: 'center',
  },
  chip: {
    height: 20,
    borderRadius: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  chipHold: {
    backgroundColor: '#E87722',
  },
  chipHeld: {
    backgroundColor: '#F5C842',
  },
  chipHidden: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
})
