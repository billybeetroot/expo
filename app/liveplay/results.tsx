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
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'

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
      <AppHeader onBack={() => router.back()} />

      <StrategyLine text={strategyPrintLine || 'RESULTS'} />

      <View style={styles.cardArea}>
        <HandDisplay
          app="LP Results"
          noSpacesHand={noSpacesHand}
          cardHoldText={cardHoldText}
          cardHoldCss={cardHoldCss}
        />
      </View>

      {/* Control row */}
      <View style={styles.controlRow}>
        <View style={styles.controlLeft}>
          <Pressable
            onPress={() => setShowPaytable((v) => !v)}
            style={styles.monitorBtn}
            accessibilityLabel="Toggle paytable"
          >
            <View style={styles.monitorScreen} />
          </Pressable>
        </View>

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
    backgroundColor: Colors.bgMain,
  },
  cardArea: {
    backgroundColor: Colors.bgMain,
    paddingVertical: 6,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bgMain,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monitorBtn: {
    width: 44,
    height: 34,
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  monitorScreen: {
    width: '80%',
    height: '60%',
    borderWidth: 1,
    borderColor: Colors.orange,
    borderRadius: 1,
  },
  whyButton: {
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  whyText: {
    fontSize: 13,
    color: Colors.orange,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
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
    backgroundColor: Colors.bgMain,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.orange,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.orange,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  modalClose: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.orange,
    borderRadius: 8,
  },
  modalCloseText: {
    fontWeight: '700',
    color: Colors.white,
    fontSize: 14,
  },
})
