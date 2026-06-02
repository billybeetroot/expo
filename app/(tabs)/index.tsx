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
import AppHeader from '@/components/ui/AppHeader'
import { Colors } from '@/constants/colors'

export default function LivePlayScreen() {
  const router = useRouter()
  const [isDealOff, setDealOff] = useState(false)
  const [showPaytable, setShowPaytable] = useState(false)

  const {
    pt, coinsPlayed, coinValue, isDeuces, displayName,
    paytableName, isMember, isLoggedIn,
  } = useAppStore()

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

  const memberLabel = isLoggedIn && isMember ? 'Member' : 'Free Demo'
  const denomDisplay = `$${parseFloat(coinValue || '1').toFixed(2)}`
  const description = strategyPrintLine || "ENTER YOUR HAND AND HIT 'DEAL'"

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onMenu={() => router.push('/config')} />

      <StrategyLine text={description} />

      <View style={styles.cardArea}>
        <HandDisplay app="LP" noSpacesHand={noSpacesHand} />
      </View>

      {/* Control row */}
      <View style={styles.controlRow}>
        <View style={styles.controlLeft}>
          <Pressable style={styles.helpBtn} accessibilityLabel="Help">
            <Text style={styles.helpText}>?</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowPaytable((v) => !v)}
            style={styles.monitorBtn}
            accessibilityLabel="Toggle paytable"
          >
            <View style={styles.monitorScreen} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleDeal}
          disabled={isDealOff}
          style={[styles.dealButton, isDealOff && styles.dealButtonDisabled]}
          accessibilityLabel="Deal"
        >
          <Text style={styles.dealText}>{isDealOff ? '...' : 'DEAL'}</Text>
        </Pressable>
      </View>

      {/* Game info status row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusMode}>Live Play</Text>
          <Text style={styles.statusMember}>{memberLabel}</Text>
        </View>
        <Text style={styles.statusInfo} numberOfLines={1}>
          {displayName}{'  '}{paytableName}{'  '}{denomDisplay}{'  '}Bet {coinsPlayed}
        </Text>
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
    paddingVertical: 6,
    backgroundColor: Colors.bgMain,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 22,
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
  dealButton: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 36,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dealButtonDisabled: {
    opacity: 0.5,
  },
  dealText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: Colors.bgMain,
  },
  statusLeft: {
    marginRight: 10,
  },
  statusMode: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
    lineHeight: 14,
  },
  statusMember: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 13,
  },
  statusInfo: {
    fontSize: 11,
    color: Colors.textLight,
    flex: 1,
    textAlign: 'right',
  },
  flex: {
    flex: 1,
  },
})
