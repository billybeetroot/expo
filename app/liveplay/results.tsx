import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useGameStore } from '@/stores/gameStore'
import { useAppStore } from '@/stores/appStore'
import HandDisplay from '@/components/cards/HandDisplay'
import EvTable from '@/components/ev/EvTable'
import StrategyLine from '@/components/game/StrategyLine'
import MainPaytable from '@/components/game/MainPaytable'

function holdPositionsToChips(positions: number[]) {
  const cardHoldText = [' ', ' ', ' ', ' ', ' ']
  const cardHoldCss = ['hold_none', 'hold_none', 'hold_none', 'hold_none', 'hold_none']
  for (const pos of positions) {
    if (pos >= 1 && pos <= 5) {
      cardHoldText[pos - 1] = 'HOLD'
      cardHoldCss[pos - 1] = 'hold_hold'
    }
  }
  return { cardHoldText, cardHoldCss }
}

export default function ResultsScreen() {
  const router = useRouter()
  const [showPaytable, setShowPaytable] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)

  const { displayName } = useAppStore()

  const {
    noSpacesHand,
    strategyPrintLine,
    resultsList,
    hand,
    evRowHighlight,
    evSelectedCardPositions,
    displayPaytable,
    setEvRowHighlight,
    setEvSelectedCardPositions,
    setDisplayHand,
    setDisplayProb,
    setEvs,
    setEvButtons,
    setGameState,
    setHand,
    setHoldCardPositions,
    setHttpHand,
    setNoSpacesHand,
    setOriginalHand,
    setPaytableOpen,
    setPayValue,
    setResultsList,
    setStrategyPrintLine,
    setSuggestedHoldCards,
  } = useGameStore()

  const handleEvRowPress = (index: number) => {
    const row = resultsList[index]
    if (!row) return

    const heldCards: string[] = row[0] ?? []
    const newPositions: number[] = []
    for (const card of heldCards) {
      const pos = hand.findIndex((c) => c === card)
      if (pos !== -1) newPositions.push(pos + 1)
    }

    setEvRowHighlight(index)
    setEvSelectedCardPositions(newPositions)
  }

  const handleNextHand = () => {
    // Reset all LP state
    setDisplayHand('')
    setDisplayProb(false)
    setEvs([])
    setEvButtons([])
    setEvRowHighlight(0)
    setEvSelectedCardPositions([])
    setGameState('New Game')
    setHand(['', '', '', '', ''])
    setHoldCardPositions([])
    setHttpHand([''])
    setNoSpacesHand('XXXXXXXXXX')
    setOriginalHand('')
    setPaytableOpen(false)
    setPayValue(0)
    setResultsList([])
    setStrategyPrintLine("PRESS 'DEAL' TO START")
    setSuggestedHoldCards([])
    router.back()
  }

  const { cardHoldText, cardHoldCss } = holdPositionsToChips(evSelectedCardPositions)

  return (
    <SafeAreaView style={styles.screen}>
      <StrategyLine text={strategyPrintLine || 'RESULTS'} />

      <HandDisplay
        app="LP Results"
        noSpacesHand={noSpacesHand}
        cardHoldText={cardHoldText}
        cardHoldCss={cardHoldCss}
      />

      <View style={styles.controlRow}>
        <Pressable
          onPress={() => setShowPaytable((v) => !v)}
          style={styles.iconButton}
          accessibilityLabel="Toggle paytable"
        >
          <Text style={styles.iconText}>{showPaytable ? '📊' : '📺'}</Text>
        </Pressable>

        <Pressable
          onPress={() => setWhyOpen(true)}
          style={styles.whyButton}
          accessibilityLabel="Why this hold"
        >
          <Text style={styles.whyText}>Why This Hold?</Text>
        </Pressable>

        <Pressable
          onPress={handleNextHand}
          style={styles.nextButton}
          accessibilityLabel="Next Hand"
        >
          <Text style={styles.nextText}>Next Hand</Text>
        </Pressable>
      </View>

      <View style={styles.flex}>
        {showPaytable ? (
          <MainPaytable displayPaytable={displayPaytable} displayName={displayName} />
        ) : (
          <EvTable
            resultsList={resultsList}
            hand={hand}
            evRowHighlight={evRowHighlight}
            onRowPress={handleEvRowPress}
          />
        )}
      </View>

      {/* Why This Hold? modal */}
      <Modal visible={whyOpen} animationType="slide" transparent onRequestClose={() => setWhyOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>WHY THIS HOLD?</Text>
            <ScrollView>
              <Text style={styles.modalBody}>{strategyPrintLine}</Text>
            </ScrollView>
            <Pressable onPress={() => setWhyOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 22,
    color: '#E87722',
  },
  whyButton: {
    borderWidth: 1,
    borderColor: '#E87722',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  whyText: {
    fontSize: 13,
    color: '#E87722',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#E87722',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  flex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E87722',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
  },
  modalClose: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E87722',
    borderRadius: 8,
  },
  modalCloseText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
  },
})
