import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface MainPaytableProps {
  displayPaytable: any[]
  displayName?: string
  highlightPayValue?: number | null
}

function parseRow(line: any): { name: string; vals: string[] } {
  if (Array.isArray(line) && line.length >= 2) {
    const [name, ...rest] = line
    return { name: String(name), vals: rest.map(String) }
  }
  if (typeof line === 'string') {
    // Already formatted string — split on whitespace runs
    const parts = line.trim().split(/\s{2,}/)
    if (parts.length >= 2) {
      return { name: parts[0]!, vals: parts.slice(1) }
    }
    return { name: line, vals: [] }
  }
  return { name: String(line), vals: [] }
}

export default function MainPaytable({ displayPaytable, displayName, highlightPayValue }: MainPaytableProps) {
  // displayPaytable is ordered highest→lowest; payValue 0=nothing, 1=jacks-or-better…
  // so the highlighted display row = length - 1 - payValue
  const highlightIndex =
    highlightPayValue != null && highlightPayValue > 0
      ? displayPaytable.length - 1 - highlightPayValue
      : -1

  return (
    <View style={styles.container}>
      {displayName && (
        <Text style={styles.title}>{displayName.toUpperCase()}</Text>
      )}

      {/* Column headers */}
      <View style={styles.headerRow}>
        <View style={styles.nameCol} />
        {['1', '2', '3', '4', '5'].map((n) => (
          <Text key={n} style={styles.headerCell}>{n}</Text>
        ))}
      </View>

      <ScrollView>
        {displayPaytable.map((line, i) => {
          const { name, vals } = parseRow(line)
          const isHighlighted = i === highlightIndex
          return (
            <View key={i} style={[styles.row, isHighlighted && styles.rowHighlighted]}>
              <Text style={[styles.name, isHighlighted && styles.nameHighlighted]} numberOfLines={1} adjustsFontSizeToFit>
                {name}
              </Text>
              {vals.map((v, j) => (
                <Text key={j} style={[styles.val, isHighlighted && styles.valHighlighted]}>{v}</Text>
              ))}
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const COL_W = 38

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.orange,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tabBarBorder,
    marginBottom: 2,
  },
  headerCell: {
    width: COL_W,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'right',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowHighlighted: {
    backgroundColor: Colors.chipHeld,
    borderRadius: 3,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
  },
  nameHighlighted: {
    color: Colors.keyText,
    fontWeight: '800',
  },
  val: {
    width: COL_W,
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'right',
  },
  valHighlighted: {
    color: Colors.keyText,
    fontWeight: '800',
  },
})
