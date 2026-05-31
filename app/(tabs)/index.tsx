'use client'
import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '@/stores/appStore'
import { useGameStore } from '@/stores/gameStore'
import { asyncDispatch } from '@/lib/dispatch'
import { decodeCheck } from '@/lib/decode'
import { buildCheckRequest } from '@/game/buildCheckRequest'
import { applyCheckResult } from '@/game/applyCheckResult'
import { interpretGamblerAlert } from '@/lib/gamblerAlert'
import HandDisplay from '@/components/cards/HandDisplay'
import CardKeyboard from '@/components/cards/CardKeyboard'
import StrategyLine from '@/components/game/StrategyLine'
import MainPaytable from '@/components/game/MainPaytable'

export default function LivePlayScreen() {
  const router = useRouter()
  const [isDealOff, setDealOff] = useState(false)
  const [showPaytable, setShowPaytable] = useState(false)

  const { pt, coinsPlayed, coinValue, isDeuces, displayName } = useAppStore()

  const {
    noSpacesHand,
    strategyPrintLine,
    displayPaytable,
    setNoSpacesHand,
    setDisplayHand,
    setHttpHand,
    setHand,
    setDisplayPaytable,
    setEvs,
    setEvButtons,
    setEvRowHighlight,
    setEvSelectedCardPositions,
    setGameState,
    setHoldCardPositions,
    setPaytable,
    setPayValue,
    setResultsList,
    setStrategyPrintLine,
    setSuggestedHoldCards,
    setValueTable,
  } = useGameStore()

  const handleHandChange = (hand: string, disp: string) => {
    setNoSpacesHand(hand)
    setDisplayHand(disp)
  }

  const handleDeal = async () => {
    if (noSpacesHand.includes('XX') || noSpacesHand.length < 10) {
      Alert.alert('Enter a Hand', 'Enter all 5 cards before hitting DEAL.')
      return
    }
    setDealOff(true)
    try {
      const requestData = buildCheckRequest(noSpacesHand, pt, coinsPlayed, coinValue, isDeuces)
      const result = await asyncDispatch(requestData)

      if (result.title !== 'successful') {
        Alert.alert(result.title, 'Could not get results. Check your connection.')
        return
      }

      const decoded = decodeCheck(result.actionPayload!)
      const state = applyCheckResult(decoded)

      // Build httpHand array from noSpacesHand for store
      const httpHand: string[] = []
      let temp = isDeuces ? noSpacesHand.replace(/W/g, '2') : noSpacesHand
      for (let i = 0; i < temp.length; i += 2) httpHand.push(temp.slice(i, i + 2))

      setHttpHand(httpHand)
      setHand(state.hand)
      setDisplayPaytable(state.displayPaytable)
      setEvs(state.evs)
      setEvButtons([])
      setEvRowHighlight(0)
      setEvSelectedCardPositions(state.evSelectedCardPositions)
      setGameState(state.gameState)
      setHoldCardPositions(state.holdCardPositions)
      setPaytable(state.paytable)
      setPayValue(state.payValue)
      setResultsList(state.resultsList)
      setStrategyPrintLine(state.strategyPrintLine)
      setSuggestedHoldCards(state.suggestedHoldCards)
      setValueTable(state.valueTable)

      const effect = interpretGamblerAlert(state.gamblerAlert)
      if (effect.kind === 'show_alert') {
        Alert.alert('', effect.message)
      }

      router.push('/liveplay/results')
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setDealOff(false)
    }
  }

  const description = strategyPrintLine || "ENTER YOUR HAND AND HIT 'DEAL'"

  return (
    <SafeAreaView style={styles.screen}>
      <StrategyLine text={description} />
      <HandDisplay app="LP" noSpacesHand={noSpacesHand} />

      <View style={styles.controlRow}>
        <Pressable
          onPress={() => setShowPaytable((v) => !v)}
          style={styles.iconButton}
          accessibilityLabel="Toggle paytable"
        >
          <Text style={styles.iconText}>{showPaytable ? '⌨' : '📺'}</Text>
        </Pressable>

        <Pressable
          onPress={handleDeal}
          disabled={isDealOff}
          style={[styles.dealButton, isDealOff && styles.dealButtonDisabled]}
          accessibilityLabel="Deal"
        >
          <Text style={styles.dealText}>DEAL</Text>
        </Pressable>
      </View>

      <View style={styles.flex}>
        {showPaytable ? (
          <MainPaytable displayPaytable={displayPaytable} displayName={displayName} />
        ) : (
          <CardKeyboard
            enteredValue={noSpacesHand}
            onHandChange={handleHandChange}
            isDeuces={isDeuces}
          />
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 24,
    color: '#E87722',
  },
  dealButton: {
    backgroundColor: '#E87722',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dealButtonDisabled: {
    opacity: 0.5,
  },
  dealText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  flex: {
    flex: 1,
  },
})
