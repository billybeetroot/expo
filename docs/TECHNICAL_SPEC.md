# Technical Spec — PerfectPLAY Native App

## Context

SPEC.md defines the product. This document translates it into concrete technical decisions: file structure, dependencies, state shape, API contracts, and platform constraints. The goal is a scaffold that can be implemented hand-over-hand without re-deriving these decisions.

---

## Stack

| Concern | Decision |
|---|---|
| Framework | Expo SDK 53, managed workflow |
| Routing | Expo Router v4 (file-based) |
| Language | TypeScript throughout |
| Styling | NativeWind v4 (Tailwind class names in JSX) |
| State | Zustand (3 stores mirroring np2) |
| Auth | Firebase JS SDK v9+ (same project as web app) |
| Payments | `@stripe/stripe-react-native` + PayPal (see §Payments) |
| Voice STT | AssemblyAI real-time v3 (same service as np2) |
| Voice TTS | `expo-speech` |
| Audio capture | `expo-av` or `react-native-audio-record` |
| HTTP | Native `fetch` — no axios |
| Compression | `pako` (pure JS — works in RN) |
| Package manager | yarn classic 1.x |

---

## Project Structure

```
expo/
├── app/                          # Expo Router
│   ├── _layout.tsx               # Root: fonts, Firebase init, Zustand providers
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab bar (Live Play | Training | Account)
│   │   ├── index.tsx             # Live Play — card entry screen
│   │   ├── training.tsx          # Training — Full Game screen
│   │   └── account.tsx           # Account / Membership screen
│   ├── liveplay/
│   │   └── results.tsx           # LP Results screen (pushed from index)
│   ├── config.tsx                # Game Configuration (modal, accessible from LP + FG)
│   └── +not-found.tsx
├── components/
│   ├── cards/
│   │   ├── HandDisplay.tsx       # 5-card row, tap-to-hold (FG) / read-only (LP results)
│   │   ├── CardKeyboard.tsx      # Rank+suit grid, same logic as np2 keyboard.tsx
│   │   └── CardImage.tsx         # Single card image with hold overlay
│   ├── ev/
│   │   └── EvTable.tsx           # 32-row HOLD/DISCARD/AVG PAYOUT table (LP + FG)
│   ├── game/
│   │   ├── StrategyLine.tsx      # strategyPrintLine banner
│   │   ├── WinLine.tsx           # CREDIT / PerfectPLAY / WIN display (FG only)
│   │   └── HoldOutcomeBanner.tsx # CORRECT HOLD / SUCCESSFUL HOLD / BAD HOLD alert
│   ├── config/
│   │   ├── GameMenus.tsx         # Game type → variant → paytable cascade pickers
│   │   ├── BetPicker.tsx         # Coins 1–5
│   │   ├── DenominationPicker.tsx
│   │   └── RecentGames.tsx       # Up to 5 Firestore-backed recent game slots
│   └── ui/
│       └── AlertBox.tsx
├── stores/
│   ├── appStore.ts               # Auth + game config + app settings
│   ├── gameStore.ts              # LP-specific state
│   └── simStore.ts               # FG/Training-specific state
├── lib/
│   ├── dispatch.ts               # asyncDispatch — POST to vpengine, decompress response
│   ├── firebase.ts               # Firebase app init (JS SDK)
│   ├── authApi.ts                # signup / login / logout / savePreviousGames
│   └── compression.ts           # base64 → pako.inflate helper
├── hooks/
│   ├── useAuth.ts                # Firebase onAuthStateChanged listener
│   └── useGameConfig.ts         # Game configured guard (equivalent of GameConfig.tsx)
├── voice/
│   ├── hooks/
│   │   ├── useVoiceInput.ts      # LP: card entry via AssemblyAI stream
│   │   └── useVoiceControl.ts    # FG: hold commands + "next hand" detection
│   └── utils/
│       ├── interpretCommand.ts   # Port from np2-newvoice (VoiceIntent detection)
│       ├── normalizeSpeech.ts    # Port from np2-newvoice (phonetic correction)
│       ├── buildHoldPhrase.ts    # Port from np2-newvoice (TTS phrase builder)
│       └── phoneticLookup.json   # Port from np2-newvoice
├── paytable/
│   └── data/                     # Port JSON files from np2/(common)/paytable/data/
├── constants/
│   └── games/                    # Port GameConstants, BonusGameConstants etc. from np2
├── assets/
│   └── cards/                    # Playing card images (52 + cardback + wild suits)
├── app.json
├── app.config.ts                 # Exposes env vars via `extra` (EXPO_PUBLIC_ prefix)
├── tailwind.config.js
├── tsconfig.json
└── .env                          # gitignored — sourced from ../perfectplay.env/.env
```

---

## Navigation Architecture

Expo Router file-based routing. Three bottom tabs:

| Tab | File | Stack inside |
|---|---|---|
| Live Play | `(tabs)/index.tsx` | Push to `liveplay/results.tsx` after DEAL |
| Training | `(tabs)/training.tsx` | Single screen (no push — FG is self-contained) |
| Account | `(tabs)/account.tsx` | Single screen |

Game Configuration opens as a **modal** from either Live Play or Training (link via `router.push('/config')`). On save it returns via `router.back()`.

---

## State Management

Three Zustand stores — same shape as np2 to minimise cognitive translation cost.

### `appStore`
```ts
{
  // Auth
  isLoggedIn: boolean
  isMember: boolean
  isSignedUp: boolean
  userName: string
  userEmail: string
  // Game config
  gameName: string        // e.g. 'Bonus'
  gameType: string        // e.g. 'Bonus Poker'
  displayName: string     // e.g. 'Bonus Poker'
  paytableName: string    // e.g. '6/5'
  pt: string              // e.g. 'Bonus_6_5'
  coinValue: string       // e.g. '1'
  coinsPlayed: string     // e.g. '5'
  isGameConfigured: boolean
  previousGames: string   // comma-separated, max 15 tokens (5 games × 3 fields)
  // Subscription IDs (for restore)
  ppPlanType / ppSubscriptionId / stripeSubscriptionId / stripeCustomerId
  // Voice
  isVoiceEnabled: boolean
  isVoiceSupported: boolean
}
```

### `gameStore` (LP)
```ts
{
  noSpacesHand: string        // 10-char e.g. 'AcKdThJh2c'
  displayHand: string         // formatted for display
  hand: string[]              // ['Ac','Kd','Th','Jh','2c']
  holdCardPositions: number[] // 1-based
  evSelectedCardPositions: number[]
  resultsList: any[][]        // 32 rows × 3 cols [heldCards, discards, ev]
  evs: string[][]
  strategyPrintLine: string
  suggestedHoldCards: string[]
  payValue: number
  gameState: string           // 'New Game' | 'After Deal'
  isKeyboardEnabled: boolean
  isPaytableOpen: boolean
  displayProb: boolean
  // ... (full mirror of np2 useGameStore)
}
```

### `simStore` (FG/Training)
```ts
{
  // Same core fields as gameStore plus:
  creditSum: number
  bestCreditSum: number
  winSum: number
  gameNumber: number
  handAssist: boolean
  defaultAssist: boolean
  dealText: 'DEAL' | 'DRAW'
  badlyPlayedHands: string[]
  replayHands: any[]
  shadowHand: string[]
  shadowHandResults: any[]
  showShadowEv: boolean
  // ... (full mirror of np2 useSimStore)
}
```

---

## API Layer

### vpengine dispatch (`lib/dispatch.ts`)

Mirrors `asyncDispatch` from np2. Endpoint: `https://vegaslearning.com/api/common/dispatch`

```
POST /api/common/dispatch
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
Body: { name: 'check'|'deal'|'draw'|'setup', ...params }

Response: { title: 'successful', data: { data: { actionPayload: string } } }
actionPayload: base64-encoded pako-deflated JSON
```

Decompression (`lib/compression.ts`):
```ts
import pako from 'pako'
const bytes = Uint8Array.from(atob(actionPayload), c => c.charCodeAt(0))
const json = pako.inflate(bytes, { to: 'string' })
const result = JSON.parse(JSON.parse(json))  // double-parse as in np2
```

For unauthenticated users: `signInAnonymously(auth)` before dispatch (same pattern as np2).

### Auth endpoints (`lib/authApi.ts`)

Same Django REST endpoints at `vegaslearning.com`:
- `POST /api/auth/signup` — create Firestore user doc
- `POST /api/auth/login` — fetch membership/previousGames on sign-in
- `POST /api/auth/logout` — server-side session invalidation
- `POST /api/auth/previousgames` — save updated previousGames string
- `POST /api/auth/membership` — save membership plan data

All requests include `Authorization: Bearer <Firebase ID token>`.

---

## Firebase Auth (`lib/firebase.ts`)

Use Firebase JS SDK v9+ (modular). Same Firebase project as web app. Credentials via `app.config.ts` extra / `EXPO_PUBLIC_` env vars.

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({ apiKey, authDomain, projectId, ... })
export const auth = getAuth(app)
export const db = getFirestore(app)
```

Auth flows: `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInAnonymously`, `signOut`. Auth state persisted via `AsyncStorage` (Expo default for Firebase JS SDK on RN).

---

## Card UI

### `CardKeyboard.tsx`
Port of np2 `keyboard.tsx`. Grid layout:
- Row 1: Suit buttons — ♣ ♦ ♥ ♠
- Rows 2–4: Rank buttons — A 2 3 4 5 6 7 8 9 T J Q K + BS
- Special: `#` = random deuces hand, `*` = random hand, BS = backspace

Input state: same `noSpacesHand` / `displayHand` / `enteredValue` pattern from np2. Port `ParseInputHand` utility directly. Deuces: display 2s as W.

### `HandDisplay.tsx`
5 `Pressable` card images in a row. Props: `{ app: 'LP'|'FG'|'LP Results', noSpacesHand: string }`.
- FG: tap toggles hold/release → updates `cardsHeld[]` in simStore
- LP Results: read-only, hold positions set by engine
- Hold overlay: coloured chip above/below card with text HOLD/HELD (mirrors np2 SimHoldLine)

Card images: copy from `np2/public/images/cards/` into `assets/cards/`. 52 cards + cardback + wild variants.

### `EvTable.tsx`
`FlatList` of 32 rows. Columns: HOLD (cards to keep) | DISCARD (cards to drop) | AVG PAYOUT (dollar EV). Highlighted row = currently selected hold. Tap row → `setEvSelectedCardPositions`, update hold chips on HandDisplay. Shadow mode: replaces EV with "WHAT WOULD IT HAVE BEEN?" outcome strings. Shared between LP Results and FG.

---

## Game Configuration Screen (`app/config.tsx`)

Modal screen. Contents:

1. **Recent Games** (`components/config/RecentGames.tsx`) — read `previousGames` string from appStore (comma-separated triples: displayName,gameName,paytableName × 5). Tapping a row pre-fills the game selectors. Firestore write on config close via `authApi.savePreviousGames`. Disabled for unauthenticated users.

2. **Game selectors** (`components/config/GameMenus.tsx`) — cascade: Game Type → Variant → Paytable. Disabled/locked for unauthenticated users (show membership CTA). Data from ported `constants/games/` files.

3. **BetPicker** — coins 1–5 (Picker or segmented control).

4. **DenominationPicker** — 25¢ / 50¢ / $1 / $2 / $5.

5. **Confirm button** — calls `asyncDispatch({ name: 'setup', pt })`, stores results in simStore (strategyTable, valueTable, paytable, displayPaytable, fullGameName, shortGameName), navigates back.

Paytable data: port static JSON files from `np2/app/(common)/paytable/data/` → `paytable/data/`. No API call needed for paytable stats display.

---

## Payments

**iOS (reader app model):** No in-app payment processing on iOS. The account screen displays plan names and prices, then opens `https://perfectplay.vegas/#member` in Safari via `Linking.openURL`. Apple gets nothing. Membership state is read from Firestore after the user purchases on the web and returns to the app.

**Android:** Full native payment sheet via `@stripe/stripe-react-native` (Monthly credit card, Annual, 48-Hour Pass) and PayPal SDK / WebView (Monthly PayPal). Same Stripe price IDs and PayPal plan IDs as the web app. Calls the same Django checkout endpoints at `vegaslearning.com/api/stripe/checkout` and PayPal equivalent.

**Membership restore:** On app launch and on account screen focus, re-fetch membership status from Firestore via `authApi.login`. No platform-specific restore flow needed.

---

## Voice

### LP Card Entry (`voice/hooks/useVoiceInput.ts`)
1. Fetch temp token from `vegaslearning.com/api/assemblyai-token` (Django endpoint).
2. Open WebSocket to `wss://streaming.assemblyai.com/v3/ws` with token + `sample_rate=16000`.
3. Capture mic audio via `expo-av` at 16 kHz mono PCM16.
4. Stream PCM frames (~100ms) to AssemblyAI WS.
5. On final transcript: port `parseIntent()` from `VoiceStreamInput.tsx` — detects card phrases ("ace of clubs" → `Ac`), commands ("backspace", "deal").
6. On "next hand" spoken on Results screen: call `nextHandHandler()` (same pattern as np2 Results page).

### FG Hold Commands (`voice/hooks/useVoiceControl.ts`)
Port `interpretCommand.ts` and `normalizeSpeech.ts` from `np2-newvoice/app/voice/utils/`. Detects `VoiceIntent` types: `hold_all`, `hold_none`, `hold_pair`, `hold_two_pair`, `hold_trips`, `hold_rank`, `hold_ranks`, `hold_suit`, `hold_positions`, `draw`. On intent: update `cardsHeld[]` in simStore and call `handleDrawButton()` on `draw`.

### TTS (`expo-speech`)
After hold is applied, speak `buildHoldPhrase(hand, holdPositions)` output. Port `buildHoldPhrase.ts` from `np2-newvoice` directly.

### Platform notes
- iOS: `AVAudioSession` category must be set to `playAndRecord` for simultaneous playback+capture.
- Android: `RECORD_AUDIO` permission in `app.json`.
- AssemblyAI env var: `ASSEMBLYAI_API_KEY` on Django server (already present); native app fetches short-lived token.

---

## Environment Variables

`app.config.ts` exposes via `expo-constants` / `EXPO_PUBLIC_` prefix:

```
EXPO_PUBLIC_API_URL=https://vegaslearning.com
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_PAYPAL_CLIENT_ID=...
EXPO_PUBLIC_MONTHLY_PRICE=12.95
EXPO_PUBLIC_ANNUAL_PRICE=99.00
EXPO_PUBLIC_VISITOR_PRICE=4.99
EXPO_PUBLIC_SETUP_FEE=5.00
```

Sourced from `../perfectplay.env/.env` (same shared store as np2).

---

## Ported Assets from np2

These files copy across unchanged or near-unchanged:

| Source (np2) | Destination (expo) |
|---|---|
| `app/(common)/paytable/data/*.json` | `paytable/data/*.json` |
| `app/(common)/components/dropdowns/GameConstants.tsx` | `constants/games/GameConstants.ts` |
| `public/images/cards/` | `assets/cards/` |
| `app/voice/utils/interpretCommand.ts` (np2-newvoice) | `voice/utils/interpretCommand.ts` |
| `app/voice/utils/normalizeSpeech.ts` (np2-newvoice) | `voice/utils/normalizeSpeech.ts` |
| `app/voice/utils/buildHoldPhrase.ts` (np2-newvoice) | `voice/utils/buildHoldPhrase.ts` |
| `app/voice/utils/phoneticLookup.json` (np2-newvoice) | `voice/utils/phoneticLookup.json` |
| `app/(common)/utils/gamblerAlert.ts` | `lib/gamblerAlert.ts` |

---

## Scaffold Order

1. `create-expo-app` in a temp dir → move contents to `/devspot/expo/` (rename project in `app.json` to `perfectplay`)
2. Install core deps: `nativewind`, `zustand`, `firebase`, `pako`, `expo-speech`, `expo-av`
3. `app.config.ts` + `.env` wired to `../perfectplay.env/.env`
4. Root `_layout.tsx` — Firebase init, auth listener, Zustand hydration
5. Tab navigator with three placeholder screens
6. `lib/dispatch.ts` + `lib/compression.ts` — API layer with a smoke-test against vpengine
7. Zustand stores (appStore → gameStore → simStore)
8. `CardKeyboard` + `HandDisplay` components
9. Live Play tab — card entry → DEAL → Results screen with EvTable
10. Firebase Auth screens (sign up / log in)
11. Training tab — full game loop (DEAL → hold → DRAW → outcome)
12. Game Configuration modal
13. Voice LP (card entry)
14. Voice FG (hold commands + TTS)
15. Account/Membership screen + payment flow
16. Polish: NativeWind theme, dark mode, haptics

---

## Verification

- `yarn start` → Expo Go on physical iOS + Android device
- `yarn ios` / `yarn android` → simulators for layout/flow testing
- Smoke test vpengine: enter `AcKdThJh2s` for Bonus 6/5 → confirm EV table returns and decompresses
- Auth: sign up new account → verify Firestore doc created → verify previousGames saves/loads
- Training: DEAL → hold pair → DRAW → verify CORRECT HOLD / BAD HOLD banner
- Voice LP: speak "Ace of clubs King of diamonds Ten hearts Jack spades Two clubs" → verify hand populated
- Voice FG: say "hold the pair" → verify correct cards marked HELD
- Payments: verify membership screen renders plan options and links correctly (platform-dependent)
