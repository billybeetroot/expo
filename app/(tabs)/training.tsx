import React, { useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, Alert, ScrollView,
} from 'react-native'
import { useAppStore } from '@/stores/appStore'
import { useSimStore } from '@/stores/simStore'
import { asyncDispatch } from '@/lib/dispatch'
import { decodePlain } from '@/lib/decode'
import { applyDealResult } from '@/game/applyDealResult'
import { applyDrawResult } from '@/game/applyDrawResult'
import { interpretGamblerAlert } from '@/lib/gamblerAlert'
import HandDisplay from '@/components/cards/HandDisplay'
import EvTable from '@/components/ev/EvTable'
import StrategyLine from '@/components/game/StrategyLine'
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'
import { useRouter } from 'expo-router'

export default function TrainingScreen() {
  const router = useRouter()
  const [isBusy, setBusy] = useState(false)

  const { pt, coinsPlayed, coinValue, isDeuces } = useAppStore()

  const {
    noSpacesHand, hand, cardsHeld, cardHoldCss, cardHoldText,
    strategyPrintLine, evs, resultsList, holdCardPositions,
    evRowHighlight, evSelectedCardPositions, paytable,
    creditSum, bestCreditSum, winSum, gameNumber,
    handAssist, gameState, dealText, shadowHand, showShadowEv,
    badlyPlayedHands, replayHands, suggestedHoldCards,
    gamblerAlert,
    setNoSpacesHand, setDisplayHand, setHand, setHttpHand,
    setEvs, setResultsList, setStrategyPrintLine, setSuggestedHoldCards,
    setHoldCardPositions, setPayValue, setGameState,
    setCardsHeld, setCardHoldCss, setCardHoldText,
    setEvRowHighlight, setEvSelectedCardPositions,
    setDealText, setGamblerAlert,
    setCreditSum, setBestCreditSum, setWinSum, setBestWin,
    setGameNumber, setPlayersNewHand, setNewCardPositions,
    setSuggestedNewHand, setSuggestedPayValue,
    setShadowHand, setShadowHandResults, setShowShadowEv,
    setBadlyPlayedHands, setReplayHands, setCardDisplay,
    setHelpLineMessage, setHandAssist,
  } = useSimStore()

  const handleCardPress = (index: number) => {
    if (gameState !== 'After Deal') return
    const updated = [...cardsHeld]
    updated[index] = updated[index] !== 'Release' ? 'Release' : 'Held'
    const updatedCss = [...cardHoldCss]
    const updatedText = [...cardHoldText]
    updatedCss[index] = updated[index] !== 'Release' ? 'hold_held' : 'hold_none'
    updatedText[index] = updated[index] !== 'Release' ? 'HELD' : ' '
    setCardsHeld(updated)
    setCardHoldCss(updatedCss)
    setCardHoldText(updatedText)
  }

  const handleDeal = async () => {
    setBusy(true)
    try {
      const result = await asyncDispatch({ name: 'deal', pt, coinsPlayed, coinValue })
      if (result.title !== 'successful') {
        Alert.alert(result.title, 'Could not deal. Check your connection.')
        return
      }
      const decoded = decodePlain(result.actionPayload!) as any
      const s = applyDealResult(decoded)

      setNoSpacesHand(s.noSpacesHand)
      setDisplayHand(s.displayHand)
      setHand(s.hand)
      setHttpHand(s.hand)
      setEvs(s.evs)
      setResultsList(s.resultsList)
      setStrategyPrintLine(s.strategyPrintLine)
      setSuggestedHoldCards(s.suggestedHoldCards)
      setHoldCardPositions(s.holdCardPositions)
      setPayValue(s.payValue)
      setGameState(s.gameState)
      setCardsHeld(s.cardsHeld)
      setCardHoldCss(s.cardHoldCss)
      setCardHoldText(s.cardHoldText)
      setDealText(s.dealText)
      setEvSelectedCardPositions(s.evSelectedCardPositions)
      setEvRowHighlight(0)
      setGamblerAlert(s.gamblerAlert)
      setShowShadowEv(false)

      // Deduct bet from credits
      const bet = Number(coinValue) * Number(coinsPlayed)
      setCreditSum(creditSum - bet)
      setBestCreditSum(bestCreditSum - bet)
      setWinSum(0)

      const effect = interpretGamblerAlert(s.gamblerAlert)
      if (effect.kind === 'show_alert') Alert.alert('', effect.message)
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDraw = async () => {
    // Compute held positions: all non-Release cards
    const positions: number[] = cardsHeld
      .map((h, i) => (h !== 'Release' ? i + 1 : 0))
      .filter(Boolean) as number[]

    setBusy(true)
    try {
      const result = await asyncDispatch({
        name: 'draw',
        hand,
        positions,
        suggestedHoldCards,
        holdCardPositions,
        gamblerAlert,
        pt,
      })
      if (result.title !== 'successful') {
        Alert.alert(result.title, 'Could not draw. Check your connection.')
        return
      }
      const decoded = decodePlain(result.actionPayload!) as any
      const s = applyDrawResult(decoded, {
        paytable, coinValue, coinsPlayed,
        creditSum, bestCreditSum, gameNumber,
        evs, hand, holdCardPositions, isDeuces,
      })

      setNoSpacesHand(s.noSpacesHand)
      setPlayersNewHand(s.playersNewHand)
      setStrategyPrintLine(s.strategyPrintLine)
      setPayValue(s.payValue)
      setSuggestedPayValue(s.suggestedPayValue)
      setWinSum(s.winSum)
      setCreditSum(s.creditSum)
      setBestWin(s.bestWin)
      setBestCreditSum(s.bestCreditSum)
      setGameNumber(s.gameNumber)
      setShadowHand(s.shadowHand)
      setShadowHandResults(s.shadowHandResults)
      setHelpLineMessage(s.helpLineMessage)
      setNewCardPositions(s.newCardPositions)
      setSuggestedNewHand(s.suggestedNewHand)
      setCardDisplay(s.cardDisplay)
      setDealText('DEAL')
      setGameState('New Game')
      setShowShadowEv(false)

      // Track badly played hands
      if (s.badlyPlayedHand.length > 0) {
        const updated = [...badlyPlayedHands, s.badlyPlayedHand.toString()].slice(-20)
        setBadlyPlayedHands(updated)
      }

      // Track replay hands
      const updatedReplay = [...replayHands, [hand, s.playersNewHand]].slice(-20)
      setReplayHands(updatedReplay)

      // Low credit check
      if (s.creditSum < 25) {
        Alert.alert(
          'Running Low',
          `Your credit is $${s.creditSum.toFixed(2)}. Consider adding more.`,
          [{ text: 'Add $100', onPress: () => { setCreditSum(s.creditSum + 100); setBestCreditSum(s.bestCreditSum + 100) } }, { text: 'OK' }]
        )
      }

      // Show hold outcome
      Alert.alert(`HAND ${Math.max(1, s.gameNumber)} — ${s.holdOutcomeMessage}`)
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setBusy(false)
    }
  }

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

  const creditLine = `CREDIT $${creditSum.toFixed(2)}   PERFECTPLAY $${bestCreditSum.toFixed(2)}   WIN $${winSum.toFixed(2)}`

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onMenu={() => router.push('/config')} />
      <StrategyLine text={strategyPrintLine} />

      <View style={styles.cardArea}>
        <HandDisplay
          app="FG"
          noSpacesHand={noSpacesHand}
          cardHoldText={cardHoldText}
          cardHoldCss={cardHoldCss}
          onCardPress={handleCardPress}
        />
      </View>

      {/* Credit line */}
      <View style={styles.creditRow}>
        <Text style={styles.creditText}>{creditLine}</Text>
      </View>

      {/* Control row */}
      <View style={styles.controlRow}>
        <Pressable
          onPress={() => setHandAssist(!handAssist)}
          style={[styles.assistBtn, handAssist && styles.assistBtnActive]}
          accessibilityLabel="Toggle hand assist"
        >
          <Text style={[styles.assistText, handAssist && styles.assistTextActive]}>
            {handAssist ? 'ASSIST ON' : 'ASSIST OFF'}
          </Text>
        </Pressable>

        {shadowHand.length > 0 && (
          <Pressable
            onPress={() => setShowShadowEv(!showShadowEv)}
            style={styles.shadowBtn}
            accessibilityLabel="Show shadow EV"
          >
            <Text style={styles.shadowText}>WHAT IF?</Text>
          </Pressable>
        )}

        <Pressable
          onPress={gameState === 'After Deal' ? handleDraw : handleDeal}
          disabled={isBusy}
          style={[styles.dealBtn, isBusy && styles.dealBtnDisabled]}
          accessibilityLabel={dealText}
        >
          <Text style={styles.dealText}>{isBusy ? '...' : dealText}</Text>
        </Pressable>
      </View>

      {/* EV table or shadow EV */}
      {handAssist && resultsList.length > 0 ? (
        <View style={styles.flex}>
          <EvTable
            resultsList={showShadowEv ? [] : resultsList}
            hand={hand}
            evRowHighlight={evRowHighlight}
            onRowPress={handleEvRowPress}
            shadowMode={showShadowEv}
          />
        </View>
      ) : (
        <View style={styles.emptyArea} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  cardArea: { paddingVertical: 6 },
  creditRow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.tabBarBorder,
  },
  creditText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  assistBtn: {
    borderWidth: 1.5,
    borderColor: Colors.tabBarBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  assistBtnActive: {
    borderColor: Colors.orange,
  },
  assistText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  assistTextActive: {
    color: Colors.orange,
  },
  shadowBtn: {
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shadowText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  dealBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dealBtnDisabled: { opacity: 0.5 },
  dealText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  flex: { flex: 1 },
  emptyArea: { flex: 1 },
})
