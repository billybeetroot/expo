import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface EvTableProps {
  resultsList: any[][]
  hand: string[]
  evRowHighlight: number
  onRowPress: (index: number) => void
  shadowMode?: boolean
}

function formatEv(raw: string, shadowMode: boolean): string {
  if (shadowMode) return raw
  const n = Number(raw)
  if (isNaN(n)) return raw
  return `$${n.toFixed(2)}`
}

function cardCodesToDisplay(cards: string[]): string {
  if (!Array.isArray(cards) || cards.length === 0) return '—'
  return cards.join(' ')
}

export default function EvTable({
  resultsList,
  hand,
  evRowHighlight,
  onRowPress,
  shadowMode = false,
}: EvTableProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      {shadowMode ? (
        <View style={styles.header}>
          <Text style={styles.headerTextCenter}>WHAT WOULD IT HAVE BEEN?</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={[styles.headerText, styles.holdCol]}>HOLD</Text>
          <Text style={[styles.headerText, styles.discardCol]}>DISCARD</Text>
          <Text style={[styles.headerText, styles.evCol]}>AVG PAYOUT</Text>
        </View>
      )}

      {/* Rows — ScrollView+map (max 32 rows, no virtualization needed) */}
      <ScrollView>
        {resultsList.map((item, index) => {
          const heldCards: string[] = item[0] ?? []
          const discardCards: string[] = item[1] ?? []
          const evValue: string = item[2] ?? '0'
          const isHighlighted = index === evRowHighlight

          return (
            <Pressable
              key={index}
              testID={`ev-row-${index}`}
              onPress={() => onRowPress(index)}
              style={[styles.row, isHighlighted && styles.rowHighlighted]}
            >
              <Text style={[styles.cell, styles.holdCol, isHighlighted && styles.cellHighlighted]}>
                {cardCodesToDisplay(heldCards)}
              </Text>
              <Text style={[styles.cell, styles.discardCol, isHighlighted && styles.cellHighlighted]}>
                {cardCodesToDisplay(discardCards)}
              </Text>
              <Text style={[styles.cell, styles.evCol, isHighlighted && styles.cellHighlighted]}>
                {formatEv(evValue, shadowMode)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBarBorder,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: 0.5,
  },
  headerTextCenter: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.orange,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tabBarBorder,
  },
  rowHighlighted: {
    backgroundColor: Colors.chipHeld,
  },
  cell: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cellHighlighted: {
    color: Colors.keyText,
    fontWeight: '800',
  },
  holdCol: {
    flex: 5,
  },
  discardCol: {
    flex: 4,
  },
  evCol: {
    flex: 2,
    textAlign: 'right',
  },
})
