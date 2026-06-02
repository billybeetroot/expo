import React, { useState, useEffect } from 'react'
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, Alert,
} from 'react-native'
import { useAppStore } from '@/stores/appStore'
import { useSimStore } from '@/stores/simStore'
import { useGameStore } from '@/stores/gameStore'
import MainPaytable from '@/components/game/MainPaytable'
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

// Row of 5 card-notation boxes shown below the card images in FG mode.
// Each box shows rank + suit glyph (e.g. "A♣"), colour-coded by suit.
function CardNotationRow({ displayHand }: { displayHand: string }) {
  return (
    <View style={notationStyles.row}>
      {[0, 2, 4, 6, 8].map((offset, i) => {
        const chars = displayHand.slice(offset, offset + 2).trim()
        const suitGlyph = chars[1] ?? ''
        const isRed = suitGlyph === '♦' || suitGlyph === '♥'
        return (
          <View key={i} style={notationStyles.box}>
            <Text style={[notationStyles.text, isRed && notationStyles.red]}>
              {chars || ' '}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const notationStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  box: {
    width: 52,
    height: 28,
    backgroundColor: Colors.keyBg,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },
  red: {
    color: '#cc0000',
  },
})

function outcomeColor(message: string): string {
  if (message.includes('CORRECT HOLD') || message.includes('SUCCESSFUL HOLD')) return '#1a6b3a'
  if (message.includes('BAD HOLD')) return '#7a2020'
  return Colors.bgKeyboard
}

function HoldOutcomeBanner({
  gameNum, message, onDismiss,
}: { gameNum: number; message: string; onDismiss: () => void }) {
  const bg = outcomeColor(message)
  return (
    <Pressable onPress={onDismiss} style={[bannerStyles.bar, { backgroundColor: bg }]} accessibilityLabel="Dismiss result">
      <Text style={bannerStyles.gameNum}>HAND {gameNum}  —  </Text>
      <Text style={bannerStyles.message}>{message}</Text>
      <Text style={bannerStyles.close}> ✕</Text>
    </Pressable>
  )
}

const bannerStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gameNum: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  message: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  close: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
  },
})

export default function TrainingScreen() {
  const router = useRouter()
  const [isBusy, setBusy] = useState(false)
  const [holdOutcome, setHoldOutcome] = useState<{ text: string; gameNum: number } | null>(null)
  const [winPayValue, setWinPayValue] = useState<number | null>(null)

  const { pt, coinsPlayed, coinValue, isDeuces, displayName } = useAppStore()
  const { displayPaytable: lpDisplayPaytable } = useGameStore()

  const {
    noSpacesHand, displayHand, hand, cardsHeld, cardHoldCss, cardHoldText,
    strategyPrintLine, evs, resultsList, holdCardPositions,
    evRowHighlight, evSelectedCardPositions, paytable,
    creditSum, bestCreditSum, winSum, gameNumber,
    handAssist, gameState, dealText, shadowHand, showShadowEv,
    badlyPlayedHands, replayHands, suggestedHoldCards,
    gamblerAlert, displayPaytable: simDisplayPaytable,
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
    setHelpLineMessage, setHandAssist, setDisplayPaytable, setPaytable, setValueTable,
  } = useSimStore()

  // Paytable: prefer simStore (populated by setup/deal), fall back to LP gameStore
  const displayPaytable = simDisplayPaytable.length > 0 ? simDisplayPaytable : lpDisplayPaytable

  // Call setup on mount (and when pt changes) to populate the paytable display.
  // This mirrors np2's behaviour: setup must be called before the FG loop starts.
  useEffect(() => {
    if (!pt) return
    asyncDispatch({ name: 'setup', pt, coinsPlayed, coinValue })
      .then((result) => {
        if (result.title !== 'successful' || !result.actionPayload) return
        const decoded = decodePlain(result.actionPayload) as any
        if (decoded?.displayPaytable) setDisplayPaytable(decoded.displayPaytable)
        if (decoded?.paytable) setPaytable(decoded.paytable)
        if (decoded?.valueTable) setValueTable(decoded.valueTable)
      })
      .catch(() => {})
  }, [pt])

  const handleCardPress = (index: number) => {
    if (gameState !== 'After Deal') return
    const updated = [...cardsHeld]
    const updatedCss = [...cardHoldCss]
    const updatedText = [...cardHoldText]

    if (updated[index] === 'Release' || updated[index] === 'Hold') {
      // Confirm hold (whether engine-suggested or user-initiated)
      updated[index] = 'Held'
      updatedCss[index] = 'hold_held'
      updatedText[index] = 'HELD'
    } else {
      // Releasing a held card — restore to 'Hold' if it was engine-suggested, else 'Release'
      const wassuggested = holdCardPositions.includes(index + 1)
      updated[index] = wassuggested ? 'Hold' : 'Release'
      updatedCss[index] = wassuggested ? 'hold_hold' : 'hold_none'
      updatedText[index] = wassuggested ? 'HOLD' : ' '
    }

    setCardsHeld(updated)
    setCardHoldCss(updatedCss)
    setCardHoldText(updatedText)
  }

  const handleDeal = async () => {
    setHoldOutcome(null)
    setWinPayValue(null)
    setDisplayHand('')
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
      if (s.displayPaytable.length > 0) setDisplayPaytable(s.displayPaytable)
      if (s.paytable.length > 0) setPaytable(s.paytable)

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

      setWinPayValue(s.payValue)
      setHoldOutcome({ text: s.holdOutcomeMessage, gameNum: Math.max(1, s.gameNumber) })
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

    // Map held card codes to 1-based hand positions
    const newPositions: number[] = []
    for (const card of heldCards) {
      const pos = hand.findIndex((c) => c === card)
      if (pos !== -1) newPositions.push(pos + 1)
    }

    // Update EV table highlight
    setEvRowHighlight(index)
    setEvSelectedCardPositions(newPositions)

    // Update card hold chips to reflect this row's hold selection
    const newCardsHeld = ['Release', 'Release', 'Release', 'Release', 'Release']
    const newCardHoldCss = ['hold_none', 'hold_none', 'hold_none', 'hold_none', 'hold_none']
    const newCardHoldText = [' ', ' ', ' ', ' ', ' ']
    for (const pos of newPositions) {
      const i = pos - 1
      newCardsHeld[i] = 'Held'
      newCardHoldCss[i] = 'hold_held'
      newCardHoldText[i] = 'HELD'
    }
    setCardsHeld(newCardsHeld)
    setCardHoldCss(newCardHoldCss)
    setCardHoldText(newCardHoldText)
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
        {displayHand.trim().length > 0 && (
          <CardNotationRow displayHand={displayHand} />
        )}
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

      {/* Hold outcome bar — sits between control row and bottom panel */}
      {holdOutcome && (
        <HoldOutcomeBanner
          gameNum={holdOutcome.gameNum}
          message={holdOutcome.text}
          onDismiss={() => setHoldOutcome(null)}
        />
      )}

      {/* Bottom panel: EV table after deal, paytable otherwise */}
      <View style={styles.flex}>
        {gameState === 'After Deal' && handAssist ? (
          <EvTable
            resultsList={resultsList}
            hand={hand}
            evRowHighlight={evRowHighlight}
            onRowPress={handleEvRowPress}
          />
        ) : (
          <MainPaytable displayPaytable={displayPaytable} displayName={displayName} highlightPayValue={winPayValue} />
        )}
      </View>
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
