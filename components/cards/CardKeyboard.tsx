import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import ParseInputHand from '@/lib/parseInputHand'
import { getDeck, shuffleDeck, dealCards, getDispHand } from '@/lib/cardDeck'
import { gameIcons } from '@/lib/gameIcons'

interface CardKeyboardProps {
  enteredValue: string
  onHandChange: (noSpacesHand: string, dispHand: string) => void
  isDeuces?: boolean
  disabled?: boolean
}

const SUIT_ROWS = [
  { value: 'c', label: 'Club',    display: gameIcons.club,    color: '#000' },
  { value: 'd', label: 'Diamond', display: gameIcons.diamond, color: '#cc0000' },
  { value: 'h', label: 'Heart',   display: gameIcons.heart,   color: '#cc0000' },
  { value: 's', label: 'Spade',   display: gameIcons.spade,   color: '#000' },
]

const RANK_ROWS = [
  ['A', '2', '3', '4'],
  ['5', '6', '7', '8'],
  ['9', 'T', 'J', 'Q'],
  ['K', '#', '*', 'BS'],
]

export default function CardKeyboard({
  enteredValue,
  onHandChange,
  isDeuces = false,
  disabled = false,
}: CardKeyboardProps) {
  const handleKey = (value: string) => {
    if (disabled) return

    let noSpacesHand = ''
    let dispHand = ''

    if (value === '#') {
      let hand = ''
      while (!hand.includes('2')) {
        const deck = getDeck()
        const shuffled = shuffleDeck(deck)
        const cards = dealCards(shuffled, 5)
        hand = cards.join('').replace(/,/g, '')
      }
      noSpacesHand = hand
      dispHand = getDispHand(hand)
    } else if (value === '*') {
      const deck = getDeck()
      const shuffled = shuffleDeck(deck)
      const cards = dealCards(shuffled, 5)
      noSpacesHand = cards.join('').replace(/,/g, '')
      dispHand = getDispHand(noSpacesHand)
    } else {
      const result = ParseInputHand('keyboard', value, enteredValue, () => {})
      noSpacesHand = result.noSpacesHand
      dispHand = result.dispHand
    }

    if (isDeuces) {
      noSpacesHand = noSpacesHand.replace(/2/g, 'W')
      dispHand = dispHand.replace(/W/g, '2')
    }

    onHandChange(noSpacesHand, dispHand)
  }

  const keyLabel = (value: string) => {
    if (value === 'BS') return gameIcons.backspace
    if (value === '*') return gameIcons.asterisk
    if (value === '#') return '#'
    return value
  }

  const keyAriaLabel = (value: string) => {
    if (value === 'BS') return 'Backspace'
    if (value === '*') return 'Random hand'
    if (value === '#') return 'Random deuces hand'
    return value
  }

  return (
    <View style={styles.container}>
      {/* Suit row */}
      <View style={styles.row}>
        {SUIT_ROWS.map(({ value, label, display, color }) => (
          <Pressable
            key={value}
            accessibilityLabel={label}
            onPress={() => handleKey(value)}
            style={styles.key}
          >
            <Text style={[styles.keyText, { color }]}>{display}</Text>
          </Pressable>
        ))}
      </View>

      {/* Rank rows */}
      {RANK_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value) => (
            <Pressable
              key={value}
              accessibilityLabel={keyAriaLabel(value)}
              onPress={() => handleKey(value)}
              style={styles.key}
            >
              <Text style={styles.keyText}>{keyLabel(value)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  key: {
    backgroundColor: '#f5c842',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
})
