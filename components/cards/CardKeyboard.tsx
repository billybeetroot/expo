import React, { useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native'
import ParseInputHand from '@/lib/parseInputHand'
import { getDeck, shuffleDeck, dealCards, getDispHand } from '@/lib/cardDeck'
import { gameIcons } from '@/lib/gameIcons'
import { Colors } from '@/constants/colors'

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
  // Own raw-input buffer — separate from the parsed noSpacesHand in the store.
  // ParseInputHand requires the raw character stream (e.g. 'Ac2d'), not the
  // padded/parsed store value ('AcXXXXXXXX' or 'XXXXXXXXXX').
  // useRef so rapid taps always see the latest value (no stale-closure race).
  const rawInputRef = useRef('')

  // Reset buffer when the parent clears the hand (Next Hand / fresh session).
  useEffect(() => {
    if (!enteredValue || enteredValue === 'XXXXXXXXXX') {
      rawInputRef.current = ''
    }
  }, [enteredValue])

  const handleKey = (value: string) => {
    if (disabled) return
    let noSpacesHand = ''
    let dispHand = ''
    const raw = rawInputRef.current

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
      rawInputRef.current = hand
    } else if (value === '*') {
      const deck = getDeck()
      const shuffled = shuffleDeck(deck)
      const cards = dealCards(shuffled, 5)
      noSpacesHand = cards.join('').replace(/,/g, '')
      dispHand = getDispHand(noSpacesHand)
      rawInputRef.current = noSpacesHand
    } else {
      const result = ParseInputHand('keyboard', value, raw, () => {})
      noSpacesHand = result.noSpacesHand
      dispHand = result.dispHand
      // Store the normalized output as the new buffer, not the raw characters.
      // Prevents suit-before-rank input (e.g. 'd2') from corrupting subsequent
      // odd-length passthroughs — ParseInputHand normalises pairs on even-length
      // strings, so the ref always holds rank-before-suit after each even step.
      rawInputRef.current = noSpacesHand
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

  const screenWidth = Dimensions.get('window').width
  // 4 keys per row with equal spacing; key diameter fills available width
  const keySize = Math.floor((screenWidth - 40) / 4)

  return (
    <View style={[styles.container, { backgroundColor: Colors.bgKeyboard }]}>
      {/* Suit row */}
      <View style={styles.row}>
        {SUIT_ROWS.map(({ value, label, display, color }) => (
          <Pressable
            key={value}
            accessibilityLabel={label}
            onPress={() => handleKey(value)}
            style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
          >
            <Text style={[styles.suitText, { color }]}>{display}</Text>
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
              style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
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
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  key: {
    backgroundColor: Colors.keyBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  suitText: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.keyText,
    textAlign: 'center',
  },
})
