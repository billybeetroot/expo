import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

interface MainPaytableProps {
  displayPaytable: string[]
  displayName?: string
}

export default function MainPaytable({ displayPaytable, displayName }: MainPaytableProps) {
  return (
    <View style={styles.container}>
      {displayName && (
        <Text style={styles.title}>{displayName.toUpperCase()}</Text>
      )}
      <ScrollView>
        {displayPaytable.map((line, i) => (
          <Text key={i} style={styles.row}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E87722',
    textAlign: 'center',
    marginBottom: 4,
  },
  row: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'monospace',
    paddingVertical: 2,
  },
})
