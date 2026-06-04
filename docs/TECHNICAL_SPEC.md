# Technical Spec — PerfectPLAY Native App

> Last updated: 2026-06-04. Reflects build state through Phase 7 (Voice) and planned Phase 8 (Payments).

## Context

SPEC.md defines the product. This document records the concrete technical decisions: stack, file structure, API contracts, and platform constraints. It was initially written before the scaffold; sections marked **[actual]** reflect what was built rather than what was planned.

---

## Stack

| Concern | Decision | Notes |
|---|---|---|
| Framework | Expo SDK **56**, managed workflow | Spec said 53; scaffold landed on 56 |
| Routing | Expo Router v4 (file-based) | |
| Language | TypeScript throughout | |
| Styling | NativeWind v4 + Tailwind **v3** | NativeWind v4 requires Tailwind v3, not v4 |
| State | Zustand (3 stores) | appStore, gameStore, simStore — mirrors np2 |
| Auth | Firebase JS SDK v12 | `getAuth()` only — Metro can't resolve `firebase/auth/react-native` subpath |
| Payments | **RevenueCat** (`react-native-purchases`) | iOS StoreKit + Android Play Billing; replaces original Stripe/PayPal plan |
| Voice STT | **`expo-speech-recognition`** | Native iOS `SFSpeechRecognizer` / Android `SpeechRecognizer`; replaces original AssemblyAI plan |
| Voice TTS | `expo-speech` | |
| HTTP | Native `fetch` — no axios | |
| Compression | `pako` (pure JS) | Used for `check` response only |
| Package manager | yarn classic 1.x | |

---

## Project Structure (actual)

```
expo/
├── app/
│   ├── _layout.tsx               # Firebase init, auth listener, anonymous pre-warm
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab bar (Live Play | Training | Account)
│   │   ├── index.tsx             # Live Play — card entry + voice input
│   │   ├── training.tsx          # Training (Full Game) — DEAL→hold→DRAW + voice control
│   │   └── account.tsx           # Account — auth-aware; membership status + purchase
│   ├── liveplay/
│   │   └── results.tsx           # LP Results — EV table, hold highlight, Why This Hold?
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot.tsx
│   ├── config.tsx                # Game Configuration modal
│   └── +not-found.tsx
├── components/
│   ├── cards/
│   │   ├── CardKeyboard.tsx      # forwardRef + addToken() for voice card entry
│   │   ├── HandDisplay.tsx       # 5-card row; FG tap-to-hold, LP read-only
│   │   └── CardImage.tsx
│   ├── ev/
│   │   └── EvTable.tsx           # ScrollView (not FlatList — avoids jest virtualisation)
│   ├── game/
│   │   ├── StrategyLine.tsx      # Light blue strategy banner
│   │   └── MainPaytable.tsx      # Paytable with winning row highlight
│   └── ui/
│       └── AppHeader.tsx         # ← and ≡ both on LEFT side
├── stores/
│   ├── appStore.ts
│   ├── gameStore.ts
│   └── simStore.ts
├── lib/
│   ├── dispatch.ts               # asyncDispatch; USE_LOCAL_BACKEND flag
│   ├── decode.ts                 # decodeCheck() compressed; decodePlain() plain
│   ├── firebase.ts
│   ├── authApi.ts                # signUp, signIn, logoutUser, savePreviousGames, etc.
│   ├── firebaseAuthErrors.ts
│   ├── previousGames.ts          # parsePreviousGames, prependPreviousGame, serialize
│   ├── gamblerAlert.ts
│   ├── cardDeck.ts
│   ├── parseInputHand.ts
│   ├── cardImageMap.ts
│   └── gameIcons.ts
├── game/
│   ├── buildCheckRequest.ts
│   ├── applyCheckResult.ts
│   ├── applyDealResult.ts
│   ├── applyDrawResult.ts
│   └── formatHoldMessage.ts
├── voice/
│   ├── hooks/
│   │   ├── useVoiceInput.ts      # LP: card entry via expo-speech-recognition
│   │   └── useVoiceControl.ts    # FG: hold commands + draw; TTS via expo-speech
│   └── utils/
│       ├── interpretCommand.ts   # VoiceIntent detection (ported from np2-newvoice)
│       ├── normalizeSpeech.ts    # Phonetic correction
│       ├── buildHoldPhrase.ts    # TTS phrase builder
│       ├── applyHoldIntent.ts    # intentToPositions(intent, hand) → number[]
│       ├── cardPhraseParser.ts   # "ace of clubs" → "Ac" for LP card entry
│       └── phoneticLookup.json
├── constants/
│   ├── colors.ts                 # Design tokens
│   └── gameData.ts               # All 5 game groups; ptFromVariantPaytable()
├── assets/
│   └── cards/                    # 59 PNGs (52 face + cardback + wild suit variants)
├── app.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Navigation Architecture

| Tab | File | Notes |
|---|---|---|
| Live Play | `(tabs)/index.tsx` | Push to `liveplay/results.tsx` after DEAL |
| Training | `(tabs)/training.tsx` | Self-contained; no push |
| Account | `(tabs)/account.tsx` | Auth-aware; purchase flow |

Config modal: `router.push('/config')` from LP or Training header (≡ button). Returns via `router.back()`. Auth screens: `app/(auth)/` stack group.

---

## API Layer

### vpengine dispatch (`lib/dispatch.ts`)

```
POST http://localhost:8000/api/          (USE_LOCAL_BACKEND = true)
POST https://vegaslearning.com/api/     (production)
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
Body: { name: 'check'|'deal'|'draw'|'setup', ...params }
```

Django returns the payload **directly** (no np2 envelope). Decoding differs per action:

| Action | Response type | Decoder |
|---|---|---|
| `check` | base64+zlib string | `decodeCheck()` — inflate + double JSON.parse |
| `deal` / `draw` / `setup` | plain JSON object | `decodePlain()` — single JSON.parse |

For unauthenticated users: `signInAnonymously(auth)` is pre-warmed at app launch to avoid Firebase clock-skew delay.

**`USE_LOCAL_BACKEND = true` in `lib/dispatch.ts` — must be set `false` before production build.**

### Auth endpoints (`lib/authApi.ts`)

Endpoints are **np2 Next.js routes** at `perfectplay.vegas/api/auth/` — not Django.

- `POST /api/auth/signup`
- `POST /api/auth/login` — returns `isMember`, `previousGames`, subscription IDs
- `POST /api/auth/logout`
- `POST /api/auth/previousgames`

All include `Authorization: Bearer <Firebase ID token>`.

### np2 Payment architecture (for context)

np2 uses Stripe (primary) and PayPal (secondary). On purchase: Stripe webhook → `checkout.session.completed` → writes `member: true`, plan type, subscription IDs, `currentPeriodEnd` to Firestore. The native app's `mergeLoginUserData` reads these same Firestore fields.

For native IAP subscribers, a new np2 endpoint (`/api/revenuecat-webhook`) will receive RevenueCat webhook events and write the same Firestore fields — keeping one source of truth for both web and native subscribers.

---

## Firebase Auth

`getAuth()` only — `firebase/auth/react-native` subpath is not resolvable by Metro. Anonymous sign-in pre-warmed in `_layout.tsx` on app launch (avoids 20s clock-skew delay on first DEAL for non-logged-in users).

---

## Voice (Phase 7 — implemented)

### STT: `expo-speech-recognition`

Native iOS `SFSpeechRecognizer` / Android `SpeechRecognizer`. No AssemblyAI, no WebSocket streaming, no PCM capture. The web app (np2-newvoice) uses AssemblyAI; the native app is completely independent.

Permissions configured in `app.json` via the `expo-speech-recognition` plugin (iOS microphone + speech recognition strings; Android `RECORD_AUDIO` already present).

### LP card entry (`voice/hooks/useVoiceInput.ts`)

- `useSpeechRecognitionEvent('result')` → `parseCardPhrase(transcript)` from `voice/utils/cardPhraseParser.ts`
- Card detected → `keyboardRef.current.addToken(token)` (feeds through CardKeyboard's rawInputRef)
- "deal" → triggers DEAL; "reset"/"backspace" → resets hand
- Partial transcripts shown in strategy line while listening

### FG hold commands (`voice/hooks/useVoiceControl.ts`)

- `useSpeechRecognitionEvent('result')` → `detectIntent(transcript)` → `intentToPositions(intent, hand)`
- Positions applied to `cardsHeld[]` / `cardHoldCss[]` / `cardHoldText[]` in simStore
- "draw" → triggers DRAW handler
- TTS echo via `expo-speech`: `buildHoldPhrase(hand, positions)` spoken after hold applied
- Uses `callbacksRef` so stale-closure never sees an old hand after a new DEAL

### CardKeyboard voice integration

`forwardRef` + `useImperativeHandle` exposes `addToken(token: string)`: feeds a 2-char card token through `ParseInputHand` (rank step then suit step), keeping `rawInputRef` in sync with keyboard-typed input. Voice and keyboard input are interchangeable mid-entry.

---

## Game Configuration (`app/config.tsx`)

Modal screen. All game data in `constants/gameData.ts`:
- 5 game groups (Bonus Poker, Double Double Bonus, Triple Bonus Poker, Deuces Wild Poker, Other)
- Every variant and paytable for each group
- `ptFromVariantPaytable(gameName, item)` — uses `item.code` when present, else `gameName + '_' + value.replace(/\//g, '_')`

UI: game type chip row → variant radio list (hidden if group has one variant) → paytable radio list → bet chip row (1–5) → denomination chip row (25c/50c/$1/$2/$5) → summary → CONFIRM.

CONFIRM: `setup` dispatch → decode → write `displayPaytable`/`paytable`/`valueTable`/`strategyTable` to simStore + `gameType`/`gameName`/`pt`/`coinValue`/`coinsPlayed` to appStore + `prependPreviousGame` + `savePreviousGames` (if logged in).

`previousGames` format: comma-joined triples `displayName,gameName,paytableName`, max 5 games (15 tokens). Managed by `lib/previousGames.ts` (pure, tested).

---

## Payments (Phase 8 — planned)

**Library:** RevenueCat (`react-native-purchases`). Abstracts StoreKit (iOS) and Google Play Billing (Android) behind one API. Handles receipt validation server-side — no custom backend endpoint needed for the native app itself.

**Pre-requisites before Phase 8 code:**
- App Store Connect: Monthly, Annual, 48-Hour Pass subscription products
- Google Play Console: same products mirrored
- RevenueCat dashboard: project + entitlements + API keys
- np2: new `/api/revenuecat-webhook` endpoint to write Firestore membership on IAP purchase
- Env vars: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

**Native app implementation:**
- `lib/purchases.ts`: `Purchases.configure()`, `getOfferings()`, `purchasePackage()`, `getCustomerInfo()`
- Entitlement check: `customerInfo.entitlements.active['premium']`
- `AppState` listener on account screen: re-fetch `getCustomerInfo()` on foreground return
- Restore purchases: `Purchases.restorePurchases()`

**$5 setup fee:** Not representable as an IAP product. Not charged to native app subscribers.

---

## Environment Variables

```
EXPO_PUBLIC_API_URL=https://vegaslearning.com
EXPO_PUBLIC_AUTH_URL=https://perfectplay.vegas
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=...        # Phase 8
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=...    # Phase 8
EXPO_PUBLIC_MONTHLY_PRICE=12.95           # Display only
EXPO_PUBLIC_ANNUAL_PRICE=99.00            # Display only
EXPO_PUBLIC_VISITOR_PRICE=4.99            # Display only
```

Sourced from `../perfectplay.env/.env`.

---

## Card UI

### CardKeyboard
Port of np2 `keyboard.tsx`. `useRef` for raw input buffer (not `useState`) — avoids stale closure race on rapid taps. Stores normalised ParseInputHand output, not raw chars. Extended with `forwardRef` + `useImperativeHandle` exposing `addToken(token)` for voice card entry.

### HandDisplay
5 `Pressable` card images. Props: `{ app: 'LP'|'FG'|'LP Results', noSpacesHand, cardHoldText, cardHoldCss, onCardPress }`. FG: tap toggles Hold→Held→Release cycle. LP Results: read-only.

### EvTable
`ScrollView` + `map` (not `FlatList` — avoids jest virtualisation issues). 32 rows × 3 cols: held cards | discards | avg payout. Tap row → applies hold positions to HandDisplay.

---

## Design Tokens (`constants/colors.ts`)

| Token | Value | Use |
|---|---|---|
| `bgMain` | `#0d3a50` | Screen background |
| `bgKeyboard` | `#092535` | Keyboard background |
| `orange` | `#e87722` | Primary action, hold chips |
| `keyBg` | `#f5e6c0` | Keyboard key background |
| `bannerBg` | `#b0d8e8` | Strategy line banner |
| `chipHeld` | `#f5c842` | Winning row highlight |
| `tabBar` | `#092535` | Tab bar background |

---

## Known Issues (Phase 9 backlog)

- Firebase auth persistence warning — needs `initializeAuth` + `AsyncStorage` persistence
- `SafeAreaView` from `react-native` deprecated — switch to `react-native-safe-area-context`
- NativeWind `className` not active — needs `react-native-reanimated` to enable metro transformer
- `USE_LOCAL_BACKEND = true` — must flip to `false` before any production build
