import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/colors'
import AppHeader from '@/components/ui/AppHeader'
import { useAppStore } from '@/stores/appStore'
import { useSimStore } from '@/stores/simStore'
import { asyncDispatch } from '@/lib/dispatch'
import { decodePlain } from '@/lib/decode'
import {
  GAME_GROUPS, DENOM_LABELS, DENOM_VALUES, BET_OPTIONS,
  GameGroup, GameVariant, PaytableItem, ptFromVariantPaytable,
} from '@/constants/gameData'
import {
  parsePreviousGames, prependPreviousGame, PreviousGame,
} from '@/lib/previousGames'
import { savePreviousGames } from '@/lib/authApi'

// ── helpers ─────────────────────────────────────────────────────────────────

function findVariantByGameName(gameName: string): {
  group: GameGroup; variant: GameVariant
} | null {
  for (const group of GAME_GROUPS) {
    for (const variant of group.variants) {
      if (variant.gameName === gameName) return { group, variant }
    }
  }
  return null
}

function findPaytableByValue(variant: GameVariant, value: string): PaytableItem | null {
  return variant.paytables.find((p) => p.value === value) ?? null
}

// ── section components ───────────────────────────────────────────────────────

type SectionProps = { label: string; children: React.ReactNode; hint?: string }

function Section({ label, children, hint }: SectionProps) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.label}>{label}</Text>
      {hint ? <Text style={sStyles.hint}>{hint}</Text> : null}
      {children}
    </View>
  )
}

const sStyles = StyleSheet.create({
  section: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  hint: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
})

// Chip row for short option lists (bet, denomination, game type)
type ChipRowProps = { options: string[]; selected: string; onSelect: (v: string) => void }

function ChipRow({ options, selected, onSelect }: ChipRowProps) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const isActive = opt === selected
        return (
          <Pressable
            key={opt}
            style={[chipStyles.chip, isActive && chipStyles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[chipStyles.text, isActive && chipStyles.textActive]}>
              {opt}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.tabBarBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  text: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  textActive: { color: Colors.white, fontWeight: '800' },
})

// Radio list for variants and paytables
type RadioListProps = { options: string[]; selected: string; onSelect: (v: string) => void }

function RadioList({ options, selected, onSelect }: RadioListProps) {
  return (
    <View style={radioStyles.container}>
      {options.map((opt) => {
        const isActive = opt === selected
        return (
          <Pressable
            key={opt}
            style={[radioStyles.row, isActive && radioStyles.rowActive]}
            onPress={() => onSelect(opt)}
          >
            <View style={[radioStyles.dot, isActive && radioStyles.dotActive]} />
            <Text style={[radioStyles.text, isActive && radioStyles.textActive]}>
              {opt}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const radioStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.tabBarBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tabBarBorder,
    gap: 10,
  },
  rowActive: { backgroundColor: 'rgba(232,119,34,0.12)' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  dotActive: { borderColor: Colors.orange, backgroundColor: Colors.orange },
  text: { fontSize: 13, color: Colors.textLight },
  textActive: { color: Colors.orange, fontWeight: '700' },
})

// ── main screen ──────────────────────────────────────────────────────────────

export default function ConfigScreen() {
  const router = useRouter()
  const {
    isLoggedIn, previousGames, userEmail, pt: currentPt,
    coinsPlayed: storedCoins, coinValue: storedCoinValue,
    gameName: storedGameName, paytableName: storedPaytableName,
    gameType: storedGameType,
    setGameName, setGameType, setDisplayName, setPaytableName,
    setPt, setCoinValue, setCoinsPlayed, setDeuces, setGameConfigured,
    setPreviousGames,
  } = useAppStore()

  const {
    setDisplayPaytable, setPaytable, setValueTable,
    setStrategyTable, setShortGameName, setFullGameName,
    setCreditSum, setBestCreditSum,
  } = useSimStore()

  const prevGames = parsePreviousGames(previousGames)

  // Initialise selections from current store values
  const initGroup = GAME_GROUPS.find((g) => g.gameType === storedGameType) ?? GAME_GROUPS[0]!
  const initVariant = initGroup.variants.find((v) => v.gameName === storedGameName) ?? initGroup.variants[0]!
  const initPaytable = initVariant.paytables.find((p) => p.value === storedPaytableName) ?? initVariant.paytables[0]!
  const initDenomLabel = (() => {
    const idx = DENOM_VALUES.indexOf(storedCoinValue)
    return idx >= 0 ? DENOM_LABELS[idx]! : '$1'
  })()

  const [selectedGroupIndex, setSelectedGroupIndex] = useState(GAME_GROUPS.indexOf(initGroup))
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initGroup.variants.indexOf(initVariant))
  const [selectedPaytableIndex, setSelectedPaytableIndex] = useState(initVariant.paytables.indexOf(initPaytable))
  const [selectedBet, setSelectedBet] = useState(storedCoins)
  const [selectedDenomLabel, setSelectedDenomLabel] = useState(initDenomLabel)
  const [isBusy, setBusy] = useState(false)

  const currentGroup = GAME_GROUPS[selectedGroupIndex]!
  const currentVariant = currentGroup.variants[selectedVariantIndex] ?? currentGroup.variants[0]!
  const currentPaytable = currentVariant.paytables[selectedPaytableIndex] ?? currentVariant.paytables[0]!

  const handleGroupSelect = useCallback((groupLabel: string) => {
    const idx = GAME_GROUPS.findIndex((g) => g.gameType === groupLabel)
    if (idx < 0) return
    setSelectedGroupIndex(idx)
    setSelectedVariantIndex(0)
    setSelectedPaytableIndex(0)
  }, [])

  const handleVariantSelect = useCallback((variantLabel: string) => {
    const idx = currentGroup.variants.findIndex((v) => v.displayName === variantLabel)
    if (idx < 0) return
    setSelectedVariantIndex(idx)
    setSelectedPaytableIndex(0)
  }, [currentGroup])

  const handlePaytableSelect = useCallback((ptLabel: string) => {
    const idx = currentVariant.paytables.findIndex((p) => p.name === ptLabel)
    if (idx < 0) return
    setSelectedPaytableIndex(idx)
  }, [currentVariant])

  const handlePreviousGame = useCallback((pg: PreviousGame) => {
    const found = findVariantByGameName(pg.gameName)
    if (!found) return
    const { group, variant } = found
    const groupIdx = GAME_GROUPS.indexOf(group)
    const variantIdx = group.variants.indexOf(variant)
    const ptItem = findPaytableByValue(variant, pg.paytableName)
    const paytableIdx = ptItem ? variant.paytables.indexOf(ptItem) : 0

    setSelectedGroupIndex(groupIdx)
    setSelectedVariantIndex(variantIdx)
    setSelectedPaytableIndex(paytableIdx)
  }, [])

  const handleConfirm = async () => {
    const denomIdx = DENOM_LABELS.indexOf(selectedDenomLabel)
    const coinVal = DENOM_VALUES[denomIdx] ?? '1'
    const paytableItem = currentPaytable
    const ptCode = ptFromVariantPaytable(currentVariant.gameName, paytableItem)
    const isDeuces = currentGroup.isDeuces ?? false

    setBusy(true)
    try {
      const result = await asyncDispatch({
        name: 'setup',
        pt: ptCode,
        coinsPlayed: selectedBet,
        coinValue: coinVal,
      })

      if (result.title === 'successful' && result.actionPayload) {
        const decoded = decodePlain(result.actionPayload) as any
        if (decoded?.displayPaytable) setDisplayPaytable(decoded.displayPaytable)
        if (decoded?.paytable) setPaytable(decoded.paytable)
        if (decoded?.valueTable) setValueTable(decoded.valueTable)
        if (decoded?.strategyTable) setStrategyTable(decoded.strategyTable)
        if (decoded?.shortGameName) setShortGameName(decoded.shortGameName)
        if (decoded?.fullGameName) setFullGameName(decoded.fullGameName)
      }

      // Apply to appStore regardless of API result
      setGameType(currentGroup.gameType)
      setGameName(currentVariant.gameName)
      setDisplayName(currentVariant.displayName)
      setPaytableName(paytableItem.value)
      setPt(ptCode)
      setCoinValue(coinVal)
      setCoinsPlayed(selectedBet)
      setDeuces(isDeuces)
      setGameConfigured(true)

      // Reset credits when game changes
      if (ptCode !== currentPt) {
        setCreditSum(100)
        setBestCreditSum(100)
      }

      // Update recent games
      const newGame: PreviousGame = {
        displayName: currentVariant.displayName,
        gameName: currentVariant.gameName,
        paytableName: paytableItem.value,
      }
      const updatedPrevGames = prependPreviousGame(previousGames, newGame)
      setPreviousGames(updatedPrevGames)
      if (isLoggedIn) {
        savePreviousGames(userEmail, updatedPrevGames).catch(() => {})
      }
    } finally {
      setBusy(false)
      router.back()
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Previous Games */}
        {isLoggedIn && prevGames.length > 0 && (
          <Section label="Recent Games" hint="Tap to pre-fill selectors">
            <View style={radioStyles.container}>
              {prevGames.map((pg, i) => (
                <Pressable key={i} style={radioStyles.row} onPress={() => handlePreviousGame(pg)}>
                  <View style={radioStyles.dot} />
                  <Text style={radioStyles.text}>
                    {pg.displayName.replace(' Wild', '')}{'\xa0'}{pg.paytableName}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        )}

        {/* Game Type */}
        <Section label="Game Type">
          <ChipRow
            options={GAME_GROUPS.map((g) => g.gameType)}
            selected={currentGroup.gameType}
            onSelect={handleGroupSelect}
          />
        </Section>

        {/* Variant */}
        {currentGroup.variants.length > 1 && (
          <Section label="Game Variant">
            <RadioList
              options={currentGroup.variants.map((v) => v.displayName)}
              selected={currentVariant.displayName}
              onSelect={handleVariantSelect}
            />
          </Section>
        )}

        {/* Paytable */}
        <Section label="Paytable">
          <RadioList
            options={currentVariant.paytables.map((p) => p.name)}
            selected={currentPaytable.name}
            onSelect={handlePaytableSelect}
          />
        </Section>

        {/* Bet */}
        <Section label="Coins Bet">
          <ChipRow options={BET_OPTIONS} selected={selectedBet} onSelect={setSelectedBet} />
        </Section>

        {/* Denomination */}
        <Section label="Coin Denomination">
          <ChipRow
            options={DENOM_LABELS}
            selected={selectedDenomLabel}
            onSelect={setSelectedDenomLabel}
          />
        </Section>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {currentVariant.displayName} — {currentPaytable.value}
          </Text>
          <Text style={styles.summaryDetail}>
            {selectedBet} coin{selectedBet !== '1' ? 's' : ''} × {selectedDenomLabel}
          </Text>
        </View>

        {/* Confirm */}
        <Pressable
          style={[styles.confirmBtn, isBusy && styles.confirmBusy]}
          onPress={handleConfirm}
          disabled={isBusy}
        >
          {isBusy
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.confirmText}>CONFIRM</Text>
          }
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgMain },
  scroll: { padding: 16 },
  summary: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  summaryDetail: { fontSize: 13, color: Colors.textMuted },
  confirmBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmBusy: { opacity: 0.6 },
  confirmText: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
})
